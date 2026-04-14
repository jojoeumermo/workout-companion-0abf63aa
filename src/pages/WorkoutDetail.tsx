import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Dumbbell, TrendingUp, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHistory } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history] = useHistory();
  const workout = history.find(w => w.id === id);

  if (!workout) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Treino não encontrado
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-36 safe-bottom">
      <header className="sticky top-0 z-40 glass-strong border-b border-border/30 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent">
        <div
          className="flex items-center justify-between max-w-lg mx-auto px-6 pb-4"
          style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 56px), 70px)' }}
        >
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform hover:bg-secondary/80">
            <ArrowLeft size={20} />
          </button>
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
            <h2 className="text-xl font-bold tracking-tight">Exercícios Realizados</h2>
            {workout.exercises.map((ex, i) => {
              const exercise = getExerciseById(ex.exerciseId);
              const completedSets = ex.sets.filter(s => s.completed);
              const exerciseVolume = completedSets.reduce((s, set) => s + set.weight * set.reps, 0);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  className="card-premium rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg">{exercise?.name || 'Exercício'}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold tracking-wide">{exerciseVolume.toLocaleString()}kg</span>
                  </div>
                  <div className="space-y-2">
                    {completedSets.map((s, j) => (
                      <div key={j} className="flex items-center justify-between bg-secondary/80 rounded-xl px-4 py-3">
                        <span className="text-sm text-muted-foreground font-bold">Série {j + 1}</span>
                        <span className="text-sm font-bold">{s.weight}kg × {s.reps} reps</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
