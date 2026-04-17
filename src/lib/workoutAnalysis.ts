import { CompletedWorkout } from '@/types/workout';
import { getExerciseById } from '@/data/exercises';

export interface ExercisePerformance {
  exerciseId: string;
  sets: { weight: number; reps: number }[];
  totalVolume: number;
  maxWeight: number;
  date: string;
}

export interface WeightSuggestion {
  suggested: number;
  reason: string;
  trend: 'up' | 'same' | 'down';
}

export interface StagnationAlert {
  exerciseId: string;
  exerciseName: string;
  workoutCount: number;
  avgWeight: number;
  suggestion: string;
}

export interface OvertrtainingAlert {
  risk: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestions: string[];
}

export interface WeeklyStats {
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  muscleDistribution: Record<string, number>;
  avgDuration: number;
}

export interface ProgressPrediction {
  exerciseId: string;
  exerciseName: string;
  currentMax: number;
  predictedIn4Weeks: number;
  weeklyGain: number;
  confidence: 'high' | 'medium' | 'low';
}

export function getLastPerformances(
  exerciseId: string,
  history: CompletedWorkout[],
  limit = 5,
): ExercisePerformance[] {
  const results: ExercisePerformance[] = [];
  for (let i = history.length - 1; i >= 0 && results.length < limit; i--) {
    const w = history[i];
    const ex = w.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) continue;
    const sets = ex.sets.filter(s => s.completed && s.weight > 0);
    if (sets.length === 0) continue;
    const maxWeight = Math.max(...sets.map(s => s.weight));
    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    results.push({
      exerciseId,
      sets: sets.map(s => ({ weight: s.weight, reps: s.reps })),
      totalVolume,
      maxWeight,
      date: w.completedAt,
    });
  }
  return results;
}

export function suggestWeight(
  exerciseId: string,
  history: CompletedWorkout[],
): WeightSuggestion | null {
  const perfs = getLastPerformances(exerciseId, history, 4);
  if (perfs.length === 0) return null;

  const last = perfs[0];
  const lastWeight = last.maxWeight;
  if (lastWeight === 0) return null;

  if (perfs.length === 1) {
    return { suggested: lastWeight, reason: 'Mesmo peso do último treino', trend: 'same' };
  }

  const prev = perfs[1];
  const prevWeight = prev.maxWeight;

  if (lastWeight > prevWeight) {
    return { suggested: lastWeight, reason: 'Mantendo a progressão', trend: 'same' };
  }

  const avgReps = last.sets.reduce((s, set) => s + set.reps, 0) / Math.max(last.sets.length, 1);

  if (avgReps >= 10) {
    const increment = lastWeight >= 80 ? 2.5 : lastWeight >= 40 ? 2.5 : 1.25;
    return {
      suggested: Math.round((lastWeight + increment) * 4) / 4,
      reason: `+${increment}kg sugerido`,
      trend: 'up',
    };
  }

  if (avgReps < 5 && lastWeight === prevWeight) {
    return {
      suggested: Math.max(lastWeight - 2.5, 0),
      reason: 'Reduza para acertar as reps',
      trend: 'down',
    };
  }

  return { suggested: lastWeight, reason: 'Mesmo peso do último treino', trend: 'same' };
}

export function detectStagnation(
  history: CompletedWorkout[],
  minWorkouts = 3,
): StagnationAlert[] {
  const exerciseIds = new Set<string>();
  history.forEach(w => w.exercises.forEach(e => exerciseIds.add(e.exerciseId)));

  const alerts: StagnationAlert[] = [];

  exerciseIds.forEach(exerciseId => {
    const perfs = getLastPerformances(exerciseId, history, 6);
    if (perfs.length < minWorkouts) return;

    const weights = perfs.slice(0, minWorkouts).map(p => p.maxWeight).filter(w => w > 0);
    if (weights.length < minWorkouts) return;

    const maxW = Math.max(...weights);
    const minW = Math.min(...weights);

    if (maxW === minW && maxW > 0) {
      const exercise = getExerciseById(exerciseId);
      alerts.push({
        exerciseId,
        exerciseName: exercise?.name || exerciseId,
        workoutCount: perfs.length,
        avgWeight: Math.round(maxW),
        suggestion: 'Tente aumentar 2.5kg ou mudar o número de reps/série.',
      });
    }
  });

  return alerts;
}

export function detectOvertraining(history: CompletedWorkout[]): OvertrtainingAlert {
  const now = Date.now();
  const last7 = history.filter(w => new Date(w.completedAt).getTime() > now - 7 * 86400000);
  const last14 = history.filter(w => new Date(w.completedAt).getTime() > now - 14 * 86400000);

  const reasons: string[] = [];
  const suggestions: string[] = [];

  if (last7.length >= 7) {
    reasons.push('Treinou todos os 7 dias da semana');
    suggestions.push('Inclua 1-2 dias de descanso por semana');
  } else if (last7.length >= 6) {
    reasons.push('Alta frequência: 6+ treinos em 7 dias');
    suggestions.push('Considere pelo menos 1 dia de descanso');
  }

  const sortedDates = [...last7]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map(w => new Date(w.completedAt).toDateString());

  let consecutive = 1;
  let maxConsecutive = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 1;
    }
  }

  if (maxConsecutive >= 5) {
    reasons.push(`${maxConsecutive} dias consecutivos de treino`);
    suggestions.push('Inclua um dia de recuperação ativa (caminhada, alongamento)');
  }

  const thisWeekVol = last7.reduce((s, w) => s + w.totalVolume, 0);
  const prevWeekWorkouts = last14.filter(w => !last7.includes(w));
  const prevWeekVol = prevWeekWorkouts.reduce((s, w) => s + w.totalVolume, 0);

  if (prevWeekVol > 0 && thisWeekVol > prevWeekVol * 1.5) {
    reasons.push('Volume semanal 50%+ maior que a semana anterior');
    suggestions.push('Reduza o volume gradualmente (máx 10% por semana)');
  }

  const muscleByDay: Record<string, string[]> = {};
  last7.forEach(w => {
    const day = new Date(w.completedAt).toDateString();
    const muscles = w.exercises
      .map(e => getExerciseById(e.exerciseId)?.muscleGroup)
      .filter(Boolean) as string[];
    muscleByDay[day] = [...(muscleByDay[day] || []), ...muscles];
  });

  const days = Object.keys(muscleByDay).sort();
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      const prevMuscles = muscleByDay[days[i - 1]];
      const currMuscles = muscleByDay[days[i]];
      const overlap = prevMuscles.filter(
        m => currMuscles.includes(m) && m !== 'Cardio' && m !== 'Abdômen',
      );
      if (overlap.length > 0) {
        reasons.push(`Grupo(s) ${[...new Set(overlap)].join(', ')} treinado(s) em dias consecutivos`);
        suggestions.push('Dê 48h de recuperação ao mesmo grupo muscular');
        break;
      }
    }
  }

  let risk: 'low' | 'medium' | 'high' = 'low';
  if (reasons.length >= 3) risk = 'high';
  else if (reasons.length >= 1) risk = 'medium';

  return { risk, reasons, suggestions };
}

export function getWeeklyStats(history: CompletedWorkout[], weeksAgo = 0): WeeklyStats {
  const now = Date.now();
  const weekStart = now - (weeksAgo + 1) * 7 * 86400000;
  const weekEnd = now - weeksAgo * 7 * 86400000;

  const weekWorkouts = history.filter(w => {
    const t = new Date(w.completedAt).getTime();
    return t >= weekStart && t < weekEnd;
  });

  const muscleDistribution: Record<string, number> = {};
  weekWorkouts.forEach(w => {
    w.exercises.forEach(e => {
      const ex = getExerciseById(e.exerciseId);
      if (ex) {
        const vol = e.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0);
        muscleDistribution[ex.muscleGroup] = (muscleDistribution[ex.muscleGroup] || 0) + vol;
      }
    });
  });

  const totalVolume = weekWorkouts.reduce((s, w) => s + w.totalVolume, 0);
  const totalDuration = weekWorkouts.reduce((s, w) => s + w.duration, 0);

  return {
    totalWorkouts: weekWorkouts.length,
    totalVolume,
    totalDuration,
    muscleDistribution,
    avgDuration: weekWorkouts.length > 0 ? Math.round(totalDuration / weekWorkouts.length) : 0,
  };
}

export function predictProgress(history: CompletedWorkout[]): ProgressPrediction[] {
  const exerciseIds = new Set<string>();
  history.forEach(w => w.exercises.forEach(e => exerciseIds.add(e.exerciseId)));

  const predictions: ProgressPrediction[] = [];

  exerciseIds.forEach(exerciseId => {
    const perfs = getLastPerformances(exerciseId, history, 8);
    if (perfs.length < 3) return;

    const sorted = [...perfs].reverse();
    const weights = sorted.map(p => p.maxWeight).filter(w => w > 0);
    if (weights.length < 3) return;

    const n = weights.length;
    const xMean = (n - 1) / 2;
    const yMean = weights.reduce((s, w) => s + w, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (weights[i] - yMean);
      den += (i - xMean) ** 2;
    }

    const slope = den > 0 ? num / den : 0;
    if (slope <= 0) return;

    const currentMax = weights[n - 1];

    const daySpan =
      (new Date(sorted[n - 1].date).getTime() - new Date(sorted[0].date).getTime()) / 86400000;
    const sessionsPerWeek = daySpan > 7 ? (n / daySpan) * 7 : 2;
    const weeklyGain = slope * sessionsPerWeek;

    if (weeklyGain < 0.1) return;

    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;

    predictions.push({
      exerciseId,
      exerciseName: exercise.name,
      currentMax,
      predictedIn4Weeks: Math.round((currentMax + weeklyGain * 4) * 4) / 4,
      weeklyGain: Math.round(weeklyGain * 10) / 10,
      confidence: perfs.length >= 6 ? 'high' : perfs.length >= 4 ? 'medium' : 'low',
    });
  });

  return predictions.sort((a, b) => b.weeklyGain - a.weeklyGain).slice(0, 5);
}

