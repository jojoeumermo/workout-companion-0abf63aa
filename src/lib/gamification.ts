import { CompletedWorkout } from '@/types/workout';
import { getExerciseById } from '@/data/exercises';
import { localDateKey } from '@/lib/dateUtils';

export interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface GamificationData {
  totalXP: number;
  level: LevelInfo;
  nextLevel: LevelInfo | null;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
  currentStreak: number;
  bestStreak: number;
  achievements: Achievement[];
  lastWorkoutXP: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  name: 'Iniciante',     minXP: 0,     color: 'text-gray-400' },
  { level: 2,  name: 'Consistente',   minXP: 200,   color: 'text-green-400' },
  { level: 3,  name: 'Dedicado',      minXP: 500,   color: 'text-green-400' },
  { level: 4,  name: 'Focado',        minXP: 1000,  color: 'text-teal-400' },
  { level: 5,  name: 'Intermediário', minXP: 2000,  color: 'text-blue-400' },
  { level: 6,  name: 'Avançado',      minXP: 4000,  color: 'text-blue-400' },
  { level: 7,  name: 'Sério',         minXP: 7000,  color: 'text-purple-400' },
  { level: 8,  name: 'Expert',        minXP: 12000, color: 'text-purple-400' },
  { level: 9,  name: 'Elite',         minXP: 20000, color: 'text-orange-400' },
  { level: 10, name: 'Mestre',        minXP: 35000, color: 'text-yellow-400' },
];

const ACHIEVEMENT_DEFS: Omit<Achievement, 'earned'>[] = [
  { id: 'first-workout',  name: 'Primeiro Passo',   description: 'Completou seu primeiro treino',     icon: '🏋️' },
  { id: 'workouts-5',     name: 'Aquecendo',         description: '5 treinos completados',              icon: '🔥' },
  { id: 'workouts-10',    name: 'Dedicado',          description: '10 treinos completados',             icon: '💪' },
  { id: 'workouts-25',    name: 'Veterano',          description: '25 treinos completados',             icon: '⚡' },
  { id: 'workouts-50',    name: 'Meio Centenário',   description: '50 treinos completados',             icon: '🎯' },
  { id: 'workouts-100',   name: 'Centenário',        description: '100 treinos completados',            icon: '🎖️' },
  { id: 'streak-3',       name: 'Três em Fila',      description: '3 dias seguidos de treino',          icon: '📅' },
  { id: 'streak-7',       name: 'Semana Perfeita',   description: '7 dias seguidos de treino',          icon: '🗓️' },
  { id: 'streak-14',      name: 'Duas Semanas',      description: '14 dias seguidos de treino',         icon: '📆' },
  { id: 'streak-30',      name: 'Mês de Ferro',      description: '30 dias seguidos de treino',         icon: '🏆' },
  { id: 'volume-1t',      name: 'Tonelada',          description: '1.000kg de volume em um treino',     icon: '🏗️' },
  { id: 'volume-100t',    name: 'Herói do Ferro',    description: '100 toneladas no total',             icon: '🌟' },
  { id: 'first-pr',       name: 'Superação',         description: 'Primeiro recorde pessoal',           icon: '⭐' },
  { id: 'muscles-4',      name: 'Equilibrado',       description: 'Treino com 4+ grupos musculares',    icon: '🎭' },
  { id: 'level-5',        name: 'Intermediário',     description: 'Atingiu o nível Intermediário',      icon: '🚀' },
];

export function calculateXPForWorkout(workout: CompletedWorkout, streak: number): number {
  let xp = 50;
  xp += Math.floor(workout.totalVolume / 100);
  const muscles = new Set(
    workout.exercises
      .map(e => getExerciseById(e.exerciseId)?.muscleGroup)
      .filter(Boolean)
  );
  xp += muscles.size * 10;
  xp += Math.floor(workout.duration / 120);
  xp += Math.min(streak * 2, 30);
  return Math.max(10, Math.round(xp));
}

export function computeStreak(history: CompletedWorkout[]): { current: number; best: number } {
  const trainedDays = new Set<string>();
  history.forEach(w => trainedDays.add(localDateKey(new Date(w.completedAt))));

  let current = 0;
  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now() - 86400000));

  if (trainedDays.has(today) || trainedDays.has(yesterday)) {
    let checkDate = trainedDays.has(today) ? new Date() : new Date(Date.now() - 86400000);
    while (trainedDays.has(localDateKey(checkDate))) {
      current++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
  }

  const sortedDays = Array.from(trainedDays).sort().reverse();
  let best = current;
  let streak = 1;
  for (let i = 0; i < sortedDays.length - 1; i++) {
    const diff = new Date(sortedDays[i]).getTime() - new Date(sortedDays[i + 1]).getTime();
    if (diff <= 86400000 + 60000) {
      streak++;
    } else {
      best = Math.max(best, streak);
      streak = 1;
    }
  }
  best = Math.max(best, streak, current);

  return { current, best };
}

export function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function computeGamification(
  history: CompletedWorkout[],
  prCount: number,
): GamificationData {
  const { current: currentStreak, best: bestStreak } = computeStreak(history);

  const sorted = [...history].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  let totalXP = 0;
  let rollingStreak = 0;
  for (const workout of sorted) {
    totalXP += calculateXPForWorkout(workout, rollingStreak);
    rollingStreak++;
  }

  const level = getLevelInfo(totalXP);
  const levelIdx = LEVELS.findIndex(l => l.level === level.level);
  const nextLevel = levelIdx < LEVELS.length - 1 ? LEVELS[levelIdx + 1] : null;

  const xpInCurrentLevel = totalXP - level.minXP;
  const xpToNextLevel = nextLevel ? nextLevel.minXP - level.minXP : 1;
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpToNextLevel) * 100));

  const lastWorkout = sorted[sorted.length - 1];
  const lastWorkoutXP = lastWorkout
    ? calculateXPForWorkout(lastWorkout, currentStreak)
    : 0;

  const totalVolume = history.reduce((s, w) => s + w.totalVolume, 0);
  const maxSingleVol = history.length > 0 ? Math.max(...history.map(w => w.totalVolume)) : 0;
  const maxMusclesInWorkout = history.length > 0
    ? Math.max(...history.map(w => new Set(w.exercises.map(e => getExerciseById(e.exerciseId)?.muscleGroup).filter(Boolean)).size))
    : 0;

  const achievements: Achievement[] = ACHIEVEMENT_DEFS.map(def => {
    let earned = false;
    switch (def.id) {
      case 'first-workout':  earned = history.length >= 1; break;
      case 'workouts-5':     earned = history.length >= 5; break;
      case 'workouts-10':    earned = history.length >= 10; break;
      case 'workouts-25':    earned = history.length >= 25; break;
      case 'workouts-50':    earned = history.length >= 50; break;
      case 'workouts-100':   earned = history.length >= 100; break;
      case 'streak-3':       earned = bestStreak >= 3; break;
      case 'streak-7':       earned = bestStreak >= 7; break;
      case 'streak-14':      earned = bestStreak >= 14; break;
      case 'streak-30':      earned = bestStreak >= 30; break;
      case 'volume-1t':      earned = maxSingleVol >= 1000; break;
      case 'volume-100t':    earned = totalVolume >= 100000; break;
      case 'first-pr':       earned = prCount >= 1; break;
      case 'muscles-4':      earned = maxMusclesInWorkout >= 4; break;
      case 'level-5':        earned = level.level >= 5; break;
    }
    return { ...def, earned };
  });

  return {
    totalXP,
    level,
    nextLevel,
    xpInCurrentLevel,
    xpToNextLevel,
    xpProgressPercent,
    currentStreak,
    bestStreak,
    achievements,
    lastWorkoutXP,
  };
}
