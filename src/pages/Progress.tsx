import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Target, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import PageShell from '@/components/PageShell';
import { useHistory, useGoals } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Progress() {
  const [history] = useHistory();
  const { goals, addGoal, removeGoal } = useGoals();
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalTarget, setGoalTarget] = useState(4);

  // Weekly volume data (last 8 weeks)
  const weeklyData: { week: string; volume: number }[] = [];
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
    weeklyData.push({ week: `S${8 - i}`, volume: Math.round(volume / 1000) });
  }

  // Frequency data
  const freqData: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const now = new Date();
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count = history.filter(w => {
      const d = new Date(w.completedAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    freqData.push({ week: `Sem ${4 - i}`, count });
  }

  // Heatmap data (last 12 weeks)
  const heatmapWeeks: { date: Date; count: number }[][] = [];
  const today = new Date();
  for (let w = 11; w >= 0; w--) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today.getTime() - (w * 7 + (6 - d)) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = history.filter(h => h.completedAt.startsWith(dateStr)).length;
      week.push({ date, count });
    }
    heatmapWeeks.push(week);
  }

  // Volume by muscle group
  const muscleVolume: Record<string, number> = {};
  history.forEach(w => {
    w.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId);
      if (exercise) {
        const vol = ex.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0);
        muscleVolume[exercise.muscleGroup] = (muscleVolume[exercise.muscleGroup] || 0) + vol;
      }
    });
  });
  const muscleData = Object.entries(muscleVolume)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, volume]) => ({ name, volume: Math.round(volume / 1000) }));

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((s, w) => s + w.totalVolume, 0);
  const avgDuration = history.length > 0 ? Math.round(history.reduce((s, w) => s + w.duration, 0) / history.length / 60) : 0;

  const thisWeekCount = history.filter(w => {
    const d = new Date(w.completedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const weeklyGoal = goals.find(g => g.type === 'weekly_frequency');

  return (
    <PageShell title="Progresso" rightAction={
      <button onClick={() => setShowGoalDialog(true)} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Target size={20} />
      </button>
    }>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 space-y-1">
            <Calendar size={16} className="text-primary" />
            <p className="text-xl font-bold">{totalWorkouts}</p>
            <p className="text-[10px] text-muted-foreground font-body">treinos</p>
          </div>
          <div className="bg-card rounded-2xl p-4 space-y-1">
            <TrendingUp size={16} className="text-primary" />
            <p className="text-xl font-bold">{(totalVolume / 1000).toFixed(1)}t</p>
            <p className="text-[10px] text-muted-foreground font-body">volume total</p>
          </div>
          <div className="bg-card rounded-2xl p-4 space-y-1">
            <BarChart3 size={16} className="text-primary" />
            <p className="text-xl font-bold">{avgDuration}m</p>
            <p className="text-[10px] text-muted-foreground font-body">média/treino</p>
          </div>
        </motion.div>

        {/* Weekly Goal */}
        {weeklyGoal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="bg-card rounded-2xl p-4 space-y-3">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Consistência</h3>
          <div className="flex gap-1 justify-center">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${
                      day.count >= 2 ? 'bg-primary' :
                      day.count === 1 ? 'bg-primary/50' :
                      'bg-secondary'
                    }`}
                    title={`${day.date.toLocaleDateString('pt-BR')} - ${day.count} treinos`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-body">
            <span>Menos</span>
            <div className="w-3 h-3 rounded-sm bg-secondary" />
            <div className="w-3 h-3 rounded-sm bg-primary/50" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Mais</span>
          </div>
        </motion.div>

        {/* Volume Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-card rounded-2xl p-5 space-y-4">
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
                <Bar dataKey="volume" fill="hsl(130 60% 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>

        {/* Volume by Muscle */}
        {muscleData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">Volume por Músculo (ton)</h3>
            <div className="space-y-3">
              {muscleData.map(m => {
                const maxVol = muscleData[0]?.volume || 1;
                return (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-body text-secondary-foreground">{m.name}</span>
                      <span className="font-medium text-primary">{m.volume}t</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(m.volume / maxVol) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Frequency */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-card rounded-2xl p-5 space-y-4">
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
                <Line type="monotone" dataKey="count" stroke="hsl(130 60% 50%)" strokeWidth={2} dot={{ fill: 'hsl(130 60% 50%)', r: 4 }} />
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
                // Remove existing weekly goal first
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
