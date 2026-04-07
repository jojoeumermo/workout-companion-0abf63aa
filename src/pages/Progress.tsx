import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Target, Plus, Trash2, Flame, Award, Settings, Clock, Activity, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, ReferenceLine } from 'recharts';
import { useNavigate } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import { useHistory, useGoals, usePersonalRecords, useBodyWeight } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Progress() {
  const navigate = useNavigate();
  const [history] = useHistory();
  const { goals, addGoal, removeGoal } = useGoals();
  const { records } = usePersonalRecords();
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalTarget, setGoalTarget] = useState(4);
  const { entries: weightEntries, latest: latestWeight } = useBodyWeight();

  // Weekly volume data (last 8 weeks)
  const weeklyData = useMemo(() => {
    const data: { week: string; volume: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const now = new Date();
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const volume = history
        .filter(w => {
          const d = new Date(w.completedAt);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((sum, w) => sum + w.totalVolume, 0);
      data.push({ week: `S${8 - i}`, volume: Math.round(volume / 1000) });
    }
    return data;
  }, [history]);

  // Frequency data
  const freqData = useMemo(() => {
    const data: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const now = new Date();
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = history.filter(w => {
        const d = new Date(w.completedAt);
        return d >= weekStart && d < weekEnd;
      }).length;
      data.push({ week: `Sem ${4 - i}`, count });
    }
    return data;
  }, [history]);

  // Heatmap data (last 16 weeks)
  const heatmapWeeks = useMemo(() => {
    const weeks: { date: Date; count: number }[][] = [];
    const today = new Date();
    for (let w = 15; w >= 0; w--) {
      const week: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today.getTime() - (w * 7 + (6 - d)) * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = history.filter(h => h.completedAt.startsWith(dateStr)).length;
        week.push({ date, count });
      }
      weeks.push(week);
    }
    return weeks;
  }, [history]);

  // Streak calculation
  const { currentStreak, bestStreak } = useMemo(() => {
    if (history.length === 0) return { currentStreak: 0, bestStreak: 0 };
    
    const trainedDays = new Set<string>();
    history.forEach(w => {
      trainedDays.add(new Date(w.completedAt).toISOString().split('T')[0]);
    });
    
    const sortedDays = Array.from(trainedDays).sort().reverse();
    let current = 0;
    let best = 0;
    
    // Check current streak from today
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (trainedDays.has(today) || trainedDays.has(yesterday)) {
      let checkDate = trainedDays.has(today) ? new Date() : new Date(Date.now() - 86400000);
      while (trainedDays.has(checkDate.toISOString().split('T')[0])) {
        current++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      }
    }
    
    // Best streak
    let streak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const diff = new Date(sortedDays[i]).getTime() - new Date(sortedDays[i + 1]).getTime();
      if (diff <= 86400000) {
        streak++;
      } else {
        best = Math.max(best, streak);
        streak = 1;
      }
    }
    best = Math.max(best, streak, current);
    
    return { currentStreak: current, bestStreak: best };
  }, [history]);

  // Volume by muscle group with series count
  const muscleStats = useMemo(() => {
    const stats: Record<string, { volume: number; sets: number }> = {};
    history.forEach(w => {
      w.exercises.forEach(ex => {
        const exercise = getExerciseById(ex.exerciseId);
        if (exercise) {
          const completedSets = ex.sets.filter(s => s.completed);
          const vol = completedSets.reduce((s, set) => s + set.weight * set.reps, 0);
          if (!stats[exercise.muscleGroup]) stats[exercise.muscleGroup] = { volume: 0, sets: 0 };
          stats[exercise.muscleGroup].volume += vol;
          stats[exercise.muscleGroup].sets += completedSets.length;
        }
      });
    });
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.sets - a.sets)
      .slice(0, 8)
      .map(([name, data]) => ({ name, volume: Math.round(data.volume / 1000), sets: data.sets }));
  }, [history]);

  // Day-of-week breakdown
  const dayOfWeekData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    history.forEach(w => {
      const day = new Date(w.completedAt).getDay();
      counts[day]++;
    });
    return days.map((day, i) => ({ day, count: counts[i] }));
  }, [history]);

  // Avg duration per week (last 8 weeks)
  const durationData = useMemo(() => {
    const data: { week: string; minutes: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const now = new Date();
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const workouts = history.filter(w => {
        const d = new Date(w.completedAt);
        return d >= weekStart && d < weekEnd;
      });
      const avg = workouts.length > 0 ? Math.round(workouts.reduce((s, w) => s + w.duration, 0) / workouts.length / 60) : 0;
      data.push({ week: `S${8 - i}`, minutes: avg });
    }
    return data;
  }, [history]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const thisMonth = history.filter(w => {
      const d = new Date(w.completedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = history.filter(w => {
      const d = new Date(w.completedAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    return {
      thisMonthCount: thisMonth.length,
      lastMonthCount: lastMonth.length,
      thisMonthVolume: thisMonth.reduce((s, w) => s + w.totalVolume, 0),
      lastMonthVolume: lastMonth.reduce((s, w) => s + w.totalVolume, 0),
    };
  }, [history]);

  // Body weight chart data (last 60 days)
  const weightChartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return weightEntries
      .filter(e => e.date >= cutoffStr)
      .map(e => ({
        date: new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        weight: e.weight,
      }));
  }, [weightEntries]);

  const avgWeight = useMemo(() => {
    if (weightChartData.length === 0) return null;
    return weightChartData.reduce((s, e) => s + e.weight, 0) / weightChartData.length;
  }, [weightChartData]);

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((s, w) => s + w.totalVolume, 0);
  const avgDuration = history.length > 0 ? Math.round(history.reduce((s, w) => s + w.duration, 0) / history.length / 60) : 0;

  const thisWeekCount = history.filter(w => {
    const d = new Date(w.completedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const weeklyGoal = goals.find(g => g.type === 'weekly_frequency');

  // Top PRs
  const topPRs = records
    .map(r => ({ ...r, exercise: getExerciseById(r.exerciseId) }))
    .filter(r => r.exercise)
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 5);

  return (
    <PageShell title="Progresso" rightAction={
      <div className="flex gap-2">
        <button onClick={() => navigate('/configuracoes')} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-muted-foreground">
          <Settings size={18} />
        </button>
        <button onClick={() => setShowGoalDialog(true)} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Target size={20} />
        </button>
      </div>
    }>
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          {[
            { icon: Calendar, value: totalWorkouts.toString(), label: 'treinos' },
            { icon: TrendingUp, value: `${(totalVolume / 1000).toFixed(1)}t`, label: 'volume' },
            { icon: Flame, value: currentStreak.toString(), label: 'dias seguidos' },
            { icon: Award, value: bestStreak.toString(), label: 'recorde' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="card-premium rounded-2xl p-3 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon size={13} className="text-primary" />
              </div>
              <p className="text-lg font-extrabold tracking-tight">{value}</p>
              <p className="text-[9px] text-muted-foreground font-body">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Monthly comparison */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="card-premium rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">Este Mês</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-extrabold text-primary tracking-tight">{monthlyStats.thisMonthCount}</p>
              <p className="text-[10px] text-muted-foreground font-body">treinos ({monthlyStats.lastMonthCount} mês passado)</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-primary tracking-tight">{(monthlyStats.thisMonthVolume / 1000).toFixed(1)}t</p>
              <p className="text-[10px] text-muted-foreground font-body">volume ({(monthlyStats.lastMonthVolume / 1000).toFixed(1)}t anterior)</p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Goal */}
        {weeklyGoal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="card-premium rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary" />
                <span className="font-semibold text-sm">Meta Semanal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{thisWeekCount}/{weeklyGoal.target}</span>
                <button onClick={() => removeGoal(weeklyGoal.id)} className="text-muted-foreground"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(thisWeekCount / weeklyGoal.target, 1) * 100}%` }} />
            </div>
          </motion.div>
        )}

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-premium rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Consistência</h3>
            <span className="text-[10px] text-muted-foreground font-body">16 semanas</span>
          </div>
          <div className="flex gap-[3px] justify-center overflow-x-auto">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[11px] h-[11px] rounded-[3px] transition-colors ${
                      day.count >= 2 ? 'bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.4)]' :
                      day.count === 1 ? 'bg-primary/45' :
                      'bg-secondary/80'
                    }`}
                    title={`${day.date.toLocaleDateString('pt-BR')} - ${day.count} treinos`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-body">
            <span>Menos</span>
            <div className="w-[11px] h-[11px] rounded-[3px] bg-secondary/80" />
            <div className="w-[11px] h-[11px] rounded-[3px] bg-primary/45" />
            <div className="w-[11px] h-[11px] rounded-[3px] bg-primary" />
            <span>Mais</span>
          </div>
        </motion.div>

        {/* Body Weight Chart */}
        {weightChartData.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="card-premium rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-primary" />
                <h3 className="font-semibold text-sm">Peso Corporal</h3>
              </div>
              <button onClick={() => navigate('/peso')} className="text-xs text-primary font-medium">Ver tudo</button>
            </div>
            {latestWeight && (
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">{latestWeight.weight} kg</p>
                  <p className="text-[10px] text-muted-foreground font-body">peso atual</p>
                </div>
                {avgWeight && (
                  <div>
                    <p className="text-2xl font-bold">{avgWeight.toFixed(1)} kg</p>
                    <p className="text-[10px] text-muted-foreground font-body">média 60d</p>
                  </div>
                )}
              </div>
            )}
            {weightChartData.length >= 2 && (
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={weightChartData}>
                  <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: 11 }} formatter={(v: any) => [`${v} kg`, 'Peso']} />
                  {avgWeight && <ReferenceLine y={parseFloat(avgWeight.toFixed(1))} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.3} />}
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 2.5 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            onClick={() => navigate('/peso')}
            className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 border border-dashed border-border active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale size={16} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Registrar Peso Corporal</p>
              <p className="text-xs text-muted-foreground font-body">Acompanhe sua evolução com gráfico</p>
            </div>
          </motion.button>
        )}

        {/* Muscle Stats */}
        {muscleStats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="card-premium rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">Séries por Músculo</h3>
            <div className="space-y-3">
              {muscleStats.map(m => {
                const maxSets = muscleStats[0]?.sets || 1;
                return (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-body text-secondary-foreground">{m.name}</span>
                      <span className="font-medium text-primary text-xs">{m.sets} séries • {m.volume}t</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(m.sets / maxSets) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Top PRs */}
        {topPRs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="card-premium rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Recordes Pessoais</h3>
            </div>
            <div className="space-y-2">
              {topPRs.map(pr => (
                <div key={pr.exerciseId} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2.5">
                  <span className="text-sm font-body truncate flex-1">{pr.exercise?.name}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground font-body shrink-0">
                    <span className="text-primary font-medium">{pr.maxWeight}kg</span>
                    <span>{pr.maxReps}reps</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Volume Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Volume Semanal (ton)</h3>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="week" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} cursor={false} />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>

        {/* Frequency */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card-premium rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Frequência Semanal</h3>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={freqData}>
                <XAxis dataKey="week" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} cursor={false} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-28 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>

        {/* Day-of-week breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="card-premium rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Treinos por Dia da Semana</h3>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dayOfWeekData}>
                <XAxis dataKey="day" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} cursor={false} formatter={(v) => [`${v} treinos`, '']} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-28 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>

        {/* Avg Duration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card-premium rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Duração Média (min)</h3>
            </div>
            {history.length > 0 && (
              <span className="text-sm font-bold text-primary">{avgDuration} min</span>
            )}
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={durationData}>
                <XAxis dataKey="week" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} cursor={false} formatter={(v) => [`${v} min`, '']} />
                <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-28 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>
      </div>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Definir Meta Semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground font-body">Quantos treinos por semana?</p>
            <div className="flex gap-3 justify-center">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setGoalTarget(n)}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-colors ${goalTarget === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const existing = goals.find(g => g.type === 'weekly_frequency');
                if (existing) removeGoal(existing.id);
                addGoal({ type: 'weekly_frequency', target: goalTarget });
                setShowGoalDialog(false);
              }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold"
            >
              Salvar Meta
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
