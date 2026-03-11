import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Dumbbell, TrendingUp, Flame, Zap, Target, ChevronRight, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory, useTemplates, useActiveWorkout, useGoals } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { ActiveWorkout } from '@/types/workout';

export default function Dashboard() {
  const navigate = useNavigate();
  const [history] = useHistory();
  const [templates] = useTemplates();
  const [, setActiveWorkout] = useActiveWorkout();
  const { goals } = useGoals();

  const thisWeek = history.filter(w => {
    const d = new Date(w.completedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const weekVolume = thisWeek.reduce((sum, w) => sum + w.totalVolume, 0);
  const weekCount = thisWeek.length;

  const recentWorkouts = history.slice(-3).reverse();

  const exerciseCount: Record<string, number> = {};
  history.forEach(w => w.exercises.forEach(e => {
    exerciseCount[e.exerciseId] = (exerciseCount[e.exerciseId] || 0) + 1;
  }));
  const topExercises = Object.entries(exerciseCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([id, count]) => ({ exercise: getExerciseById(id), count }))
    .filter(e => e.exercise);

  const startFreeWorkout = () => {
    const active: ActiveWorkout = {
      name: 'Treino Livre',
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      exercises: [],
    };
    setActiveWorkout(active);
    navigate('/treino-ativo');
  };

  const weeklyGoal = goals.find(g => g.type === 'weekly_frequency');
  const goalProgress = weeklyGoal ? Math.min(weekCount / weeklyGoal.target, 1) : null;

  return (
    <PageShell>
      <div className="pt-14 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <p className="text-muted-foreground font-body text-sm">Pronto para treinar?</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        </motion.div>

        {/* Start Buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
          <button
            onClick={() => navigate('/treinos')}
            className="w-full bg-primary text-primary-foreground rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="text-left">
              <span className="text-lg font-bold block">Iniciar Treino</span>
              <span className="text-sm opacity-80 font-body">
                {templates.length > 0 ? `${templates.length} rotinas salvas` : 'Crie sua primeira rotina'}
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Play size={28} fill="currentColor" />
            </div>
          </button>
          <button
            onClick={startFreeWorkout}
            className="w-full bg-card text-foreground rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform border border-border"
          >
            <div className="text-left">
              <span className="font-semibold block">Treino Livre</span>
              <span className="text-xs text-muted-foreground font-body">Sem rotina pré-definida</span>
            </div>
            <Zap size={22} className="text-primary" />
          </button>
        </motion.div>

        {/* Weekly Goal */}
        {goalProgress !== null && weeklyGoal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary" />
                <span className="font-semibold text-sm">Meta Semanal</span>
              </div>
              <span className="text-sm font-bold text-primary">{weekCount}/{weeklyGoal.target}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalProgress * 100}%` }} />
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-4 space-y-2">
            <Flame size={20} className="text-primary" />
            <p className="text-2xl font-bold">{weekCount}</p>
            <p className="text-xs text-muted-foreground font-body">treinos esta semana</p>
          </div>
          <div className="bg-card rounded-2xl p-4 space-y-2">
            <TrendingUp size={20} className="text-primary" />
            <p className="text-2xl font-bold">{weekVolume > 1000 ? `${(weekVolume / 1000).toFixed(1)}t` : `${weekVolume}kg`}</p>
            <p className="text-xs text-muted-foreground font-body">volume esta semana</p>
          </div>
        </motion.div>

        {/* Recent */}
        {recentWorkouts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Últimos Treinos</h2>
              <button onClick={() => navigate('/historico')} className="text-xs text-primary font-medium flex items-center gap-0.5">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {recentWorkouts.map(w => (
                <button
                  key={w.id}
                  onClick={() => navigate(`/historico/${w.id}`)}
                  className="w-full bg-card rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{w.name}</span>
                    <span className="text-xs text-muted-foreground font-body">
                      {new Date(w.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-body">
                    <span>{w.exercises.length} exercícios</span>
                    <span>•</span>
                    <span>{Math.round(w.duration / 60)} min</span>
                    <span>•</span>
                    <span>{w.totalVolume.toLocaleString()}kg</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top */}
        {topExercises.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            <h2 className="text-lg font-semibold">Mais Usados</h2>
            <div className="grid grid-cols-2 gap-3">
              {topExercises.map(({ exercise: ex, count }) => ex && (
                <div key={ex.id} className="bg-card rounded-2xl p-4 space-y-1">
                  <Dumbbell size={16} className="text-primary" />
                  <p className="font-medium text-sm truncate">{ex.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{count}x usado</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center py-12 space-y-3">
            <Dumbbell size={48} className="text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-body">Comece seu primeiro treino!</p>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
