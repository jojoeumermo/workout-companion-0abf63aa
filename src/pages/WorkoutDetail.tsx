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
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      <main className="px-5">
        <div className="max-w-lg mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold">{workout.name}</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {new Date(workout.completedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-4 text-center">
              <Clock size={18} className="text-primary mx-auto mb-2" />
              <p className="text-lg font-bold">{Math.round(workout.duration / 60)}</p>
              <p className="text-xs text-muted-foreground font-body">min</p>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center">
              <Dumbbell size={18} className="text-primary mx-auto mb-2" />
              <p className="text-lg font-bold">{workout.exercises.length}</p>
              <p className="text-xs text-muted-foreground font-body">exercícios</p>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center">
              <TrendingUp size={18} className="text-primary mx-auto mb-2" />
              <p className="text-lg font-bold">{(workout.totalVolume / 1000).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground font-body">ton</p>
            </div>
          </motion.div>

          {workout.notes && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="bg-card rounded-2xl p-4 flex gap-3">
              <MessageSquare size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-secondary-foreground font-body">{workout.notes}</p>
            </motion.div>
          )}

          <div className="space-y-4">
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
                  className="bg-card rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{exercise?.name || 'Exercício'}</h3>
                    <span className="text-xs text-primary font-medium">{exerciseVolume.toLocaleString()}kg</span>
                  </div>
                  <div className="space-y-2">
                    {completedSets.map((s, j) => (
                      <div key={j} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2.5">
                        <span className="text-sm text-muted-foreground font-body">Série {j + 1}</span>
                        <span className="text-sm font-medium">{s.weight}kg × {s.reps} reps</span>
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
