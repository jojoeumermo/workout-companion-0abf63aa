import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Dumbbell, Target, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { getExerciseById } from '@/data/exercises';
import { useFavorites, useHistory, usePersonalRecords } from '@/hooks/useStorage';

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [history] = useHistory();
  const { getRecord } = usePersonalRecords();

  const exercise = getExerciseById(id || '');
  if (!exercise) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Exercício não encontrado</div>;

  const record = getRecord(exercise.id);

  // Get history for this exercise
  const exerciseHistory = history
    .flatMap(w => w.exercises.filter(e => e.exerciseId === exercise.id).map(e => ({ date: w.completedAt, sets: e.sets })))
    .slice(-10)
    .reverse();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-5 pt-14 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => toggleFavorite(exercise.id)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
          <Heart size={20} className={isFavorite(exercise.id) ? 'text-primary fill-primary' : 'text-muted-foreground'} />
        </button>
      </header>

      <main className="px-5 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="w-full h-48 bg-card rounded-2xl flex items-center justify-center">
            <Dumbbell size={64} className="text-muted-foreground/20" />
          </div>
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{exercise.muscleGroup}</span>
            {exercise.secondaryMuscles.map(m => (
              <span key={m} className="px-3 py-1 bg-secondary text-muted-foreground rounded-lg text-xs font-medium">{m}</span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-primary" />
            <span className="font-semibold text-sm">Equipamento</span>
          </div>
          <p className="text-sm text-muted-foreground font-body">{exercise.equipment}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <span className="font-semibold text-sm">Como Executar</span>
          </div>
          <p className="text-sm text-muted-foreground font-body">{exercise.description}</p>
          <ol className="space-y-2">
            {exercise.instructions.map((inst, i) => (
              <li key={i} className="flex gap-3 text-sm font-body text-secondary-foreground">
                <span className="text-primary font-semibold">{i + 1}.</span>
                {inst}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Personal Records */}
        {record && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">Recordes Pessoais</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary">{record.maxWeight}kg</p>
                <p className="text-xs text-muted-foreground font-body">Peso</p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary">{record.maxReps}</p>
                <p className="text-xs text-muted-foreground font-body">Reps</p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary">{record.maxVolume}kg</p>
                <p className="text-xs text-muted-foreground font-body">Volume</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* History */}
        {exerciseHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            <h3 className="font-semibold text-sm">Histórico Recente</h3>
            {exerciseHistory.map((h, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 space-y-2">
                <p className="text-xs text-muted-foreground font-body">
                  {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <div className="space-y-1">
                  {h.sets.filter(s => s.completed).map((s, j) => (
                    <p key={j} className="text-sm font-body text-secondary-foreground">
                      Série {j + 1} — {s.weight}kg × {s.reps} reps
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
