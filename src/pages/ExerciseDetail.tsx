import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Target, Wrench, Trophy, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { getExerciseById } from '@/data/exercises';
import { useFavorites, useHistory, usePersonalRecords, useCustomExercises } from '@/hooks/useStorage';
import { getMuscleColor } from '@/lib/muscleColors';

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [history] = useHistory();
  const { getRecord } = usePersonalRecords();
  const { exercises: customExercises } = useCustomExercises();

  const exercise = getExerciseById(id || '');
  if (!exercise) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Exercício não encontrado</div>;

  const record = getRecord(exercise.id);
  const color = getMuscleColor(exercise.muscleGroup);
  const customEx = customExercises.find(ce => ce.id === exercise.id);
  const exerciseImage = customEx?.image;

  const exerciseHistory = history
    .flatMap(w => w.exercises.filter(e => e.exerciseId === exercise.id).map(e => ({ date: w.completedAt, sets: e.sets })))
    .slice(-10)
    .reverse();

  const bestSet = exerciseHistory.length > 0
    ? exerciseHistory.flatMap(h => h.sets.filter(s => s.completed)).reduce((best, s) => s.weight > (best?.weight || 0) ? s : best, null as null | { weight: number; reps: number; completed: boolean })
    : null;

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

      <main className="px-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Hero image or muscle-group banner */}
          {exerciseImage ? (
            <div className="w-full h-52 rounded-2xl overflow-hidden">
              <img src={exerciseImage} alt={exercise.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-full h-52 rounded-2xl flex flex-col items-center justify-center gap-3 border ${color.bg} ${color.border}`}>
              <div className={`w-20 h-20 rounded-2xl ${color.bg} border ${color.border} flex items-center justify-center`}>
                <Dumbbell size={40} className={color.text} />
              </div>
              <span className={`text-sm font-black tracking-widest uppercase ${color.text}`}>{exercise.muscleGroup}</span>
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-black tracking-tight leading-tight flex-1">{exercise.name}</h1>
              {record && (
                <div className="flex items-center gap-1.5 bg-primary/10 rounded-xl px-3 py-1.5 shrink-0">
                  <Trophy size={14} className="text-primary" />
                  <span className="text-xs font-black text-primary">{record.maxWeight}kg PR</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${color.bg} ${color.text} ${color.border}`}>{exercise.muscleGroup}</span>
              {exercise.secondaryMuscles?.map(m => (
                <span key={m} className="px-3 py-1 bg-secondary text-muted-foreground rounded-lg text-xs font-medium">{m}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Equipment */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-primary" />
            <span className="font-semibold text-sm">Equipamento</span>
          </div>
          <p className="text-sm text-muted-foreground font-body">{exercise.equipment}</p>
        </motion.div>

        {/* How to */}
        {(exercise.description || exercise.instructions?.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <span className="font-semibold text-sm">Como Executar</span>
            </div>
            {exercise.description && (
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{exercise.description}</p>
            )}
            {exercise.instructions?.length > 0 && (
              <ol className="space-y-2.5">
                {exercise.instructions.map((inst, i) => (
                  <li key={i} className="flex gap-3 text-sm font-body text-secondary-foreground">
                    <span className={`font-black text-sm shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-xs ${color.bg} ${color.text}`}>{i + 1}</span>
                    <span className="leading-snug">{inst}</span>
                  </li>
                ))}
              </ol>
            )}
          </motion.div>
        )}

        {/* Personal Records */}
        {record && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Recordes Pessoais</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-3 text-center border ${color.bg} ${color.border}`}>
                <p className={`text-xl font-black ${color.text}`}>{record.maxWeight}kg</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Peso</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${color.bg} ${color.border}`}>
                <p className={`text-xl font-black ${color.text}`}>{record.maxReps}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Reps</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${color.bg} ${color.border}`}>
                <p className={`text-xl font-black ${color.text}`}>{record.maxVolume}kg</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Volume</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* History */}
        {exerciseHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            <h3 className="font-semibold text-sm px-1">Histórico Recente</h3>
            {exerciseHistory.map((h, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 space-y-2">
                <p className="text-xs text-muted-foreground font-body">
                  {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {h.sets.filter(s => s.completed).map((s, j) => (
                    <div key={j} className="bg-secondary/60 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-body">S{j + 1}</span>
                      <span className="text-xs font-bold">{s.weight}kg × {s.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {exerciseHistory.length === 0 && !record && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-secondary/40 rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm font-bold text-muted-foreground">Sem histórico ainda</p>
            <p className="text-xs text-muted-foreground font-body">Complete um treino com este exercício para ver seu histórico e recordes aqui.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
