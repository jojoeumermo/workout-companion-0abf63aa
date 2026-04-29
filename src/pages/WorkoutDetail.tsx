import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Dumbbell, TrendingUp, MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistory } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptic';

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history, , { deleteWorkout, updateWorkout }] = useHistory();
  const workout = history.find(w => w.id === id);
  const { toast } = useToast();

  const [editMode, setEditMode] = useState(false);
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState(false);
  const [confirmRemoveExercise, setConfirmRemoveExercise] = useState<number | null>(null);

  if (!workout) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Treino não encontrado
    </div>
  );

  const recomputeVolume = (exercises: typeof workout.exercises) =>
    exercises.reduce(
      (sum, ex) =>
        sum +
        ex.sets
          .filter(s => s.completed)
          .reduce((s, set) => s + set.weight * set.reps, 0),
      0
    );

  const handleRemoveExercise = (idx: number) => {
    updateWorkout(workout.id, w => {
      const nextEx = w.exercises.filter((_, i) => i !== idx);
      return { ...w, exercises: nextEx, totalVolume: recomputeVolume(nextEx) };
    });
    setConfirmRemoveExercise(null);
    haptic('medium');
    toast({ title: 'Exercício removido', description: 'Volume semanal recalculado.' });
  };

  const handleDeleteWorkout = () => {
    deleteWorkout(workout.id);
    haptic('medium');
    toast({ title: 'Treino removido' });
    navigate('/historico');
  };

  return (
    <div className="min-h-screen bg-background pb-36 safe-bottom">
      <header className="sticky top-0 z-40 glass-strong border-b border-border/30 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent">
        <div
          className="flex items-center justify-between max-w-lg mx-auto px-6 pb-4 gap-2"
          style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 56px), 70px)' }}
        >
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform hover:bg-secondary/80">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className={`h-11 px-3 rounded-xl flex items-center gap-2 active:scale-95 transition-transform text-sm font-bold ${editMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
            >
              {editMode ? <><Check size={16} /> Pronto</> : <><Pencil size={16} /> Editar</>}
            </button>
            <button
              onClick={() => setConfirmDeleteWorkout(true)}
              className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Excluir treino"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 sm:px-6 pt-6">
        <div className="max-w-lg mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black tracking-tight leading-tight">{workout.name}</h1>
            <p className="text-base text-muted-foreground font-bold mt-1">
              {new Date(workout.completedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
            <div className="card-premium rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Clock size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight leading-none">{Math.round(workout.duration / 60)}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">minutos</p>
              </div>
            </div>
            <div className="card-premium rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Dumbbell size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight leading-none">{workout.exercises.length}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">exercícios</p>
              </div>
            </div>
            <div className="card-premium rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight leading-none">{(workout.totalVolume / 1000).toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">toneladas</p>
              </div>
            </div>
          </motion.div>

          {workout.notes && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="card-premium rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-primary" />
              </div>
              <p className="text-sm text-foreground font-body leading-relaxed">{workout.notes}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Exercícios Realizados</h2>
              {editMode && (
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                  modo edição
                </span>
              )}
            </div>
            <AnimatePresence initial={false}>
              {workout.exercises.map((ex, i) => {
                const exercise = getExerciseById(ex.exerciseId);
                const completedSets = ex.sets.filter(s => s.completed);
                const exerciseVolume = completedSets.reduce((s, set) => s + set.weight * set.reps, 0);

                return (
                  <motion.div
                    key={`${ex.exerciseId}-${i}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: editMode ? 0 : 0.1 + i * 0.03 }}
                    className="card-premium rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-black text-lg truncate">{exercise?.name || 'Exercício'}</h3>
                        {exercise?.muscleGroup && (
                          <p className="text-xs text-muted-foreground font-bold mt-0.5">{exercise.muscleGroup}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold tracking-wide">
                          {exerciseVolume.toLocaleString()}kg
                        </span>
                        {editMode && (
                          <button
                            onClick={() => setConfirmRemoveExercise(i)}
                            className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center active:scale-90"
                            aria-label="Remover exercício"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {completedSets.map((s, j) => (
                        <div key={j} className="flex items-center justify-between bg-secondary/80 rounded-xl px-4 py-3">
                          <span className="text-sm text-muted-foreground font-bold">Série {j + 1}</span>
                          <span className="text-sm font-bold">{s.weight}kg × {s.reps} reps</span>
                        </div>
                      ))}
                      {completedSets.length === 0 && (
                        <p className="text-xs text-muted-foreground font-body italic px-1">Nenhuma série completada</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {workout.exercises.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm font-body">Sem exercícios neste registro.</p>
                <button
                  onClick={() => setConfirmDeleteWorkout(true)}
                  className="mt-3 text-xs text-destructive font-bold inline-flex items-center gap-1.5"
                >
                  <Trash2 size={12} /> Excluir treino vazio
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirm delete workout */}
      <Dialog open={confirmDeleteWorkout} onOpenChange={setConfirmDeleteWorkout}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Excluir treino?</DialogTitle>
            <DialogDescription>
              Esta ação remove o treino do histórico e recalcula seu progresso semanal. Não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setConfirmDeleteWorkout(false)}
              className="flex-1 bg-secondary rounded-xl py-3 font-bold text-sm active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteWorkout}
              className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-3 font-bold text-sm active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm remove exercise */}
      <Dialog open={confirmRemoveExercise !== null} onOpenChange={() => setConfirmRemoveExercise(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Remover exercício?</DialogTitle>
            <DialogDescription>
              {confirmRemoveExercise !== null && workout.exercises[confirmRemoveExercise]
                ? `"${getExerciseById(workout.exercises[confirmRemoveExercise].exerciseId)?.name || 'Exercício'}" será removido deste treino e o volume será recalculado.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setConfirmRemoveExercise(null)}
              className="flex-1 bg-secondary rounded-xl py-3 font-bold text-sm active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmRemoveExercise !== null && handleRemoveExercise(confirmRemoveExercise)}
              className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-3 font-bold text-sm active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Remover
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
