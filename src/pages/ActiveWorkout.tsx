import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, SkipForward, ChevronRight, ChevronLeft, Timer, Copy, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveWorkout, useHistory, usePersonalRecords } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { CompletedWorkout, CompletedExercise } from '@/types/workout';

export default function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const [activeWorkout, setActiveWorkout] = useActiveWorkout();
  const [history, setHistory] = useHistory();
  const { updateRecord } = usePersonalRecords();

  const [restTimer, setRestTimer] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Elapsed timer
  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeWorkout?.startedAt]);

  // Rest timer countdown
  useEffect(() => {
    if (!showRest || restTimer <= 0) return;
    const id = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) { setShowRest(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showRest, restTimer]);

  if (!activeWorkout) {
    navigate('/treinos');
    return null;
  }

  const currentEx = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
  const exercise = getExerciseById(currentEx?.exerciseId || '');

  const updateSet = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = [...exercises[prev.currentExerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      exercises[prev.currentExerciseIndex] = { ...exercises[prev.currentExerciseIndex], sets };
      return { ...prev, exercises };
    });
  };

  const completeSet = (setIndex: number) => {
    setFlashIndex(setIndex);
    setTimeout(() => setFlashIndex(null), 300);

    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = [...exercises[prev.currentExerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], completed: true };
      // Auto-fill next set
      if (setIndex + 1 < sets.length && !sets[setIndex + 1].completed) {
        sets[setIndex + 1] = {
          ...sets[setIndex + 1],
          weight: sets[setIndex].weight,
          reps: sets[setIndex].reps || sets[setIndex + 1].targetReps,
          targetReps: sets[setIndex + 1].targetReps,
          completed: false,
        };
      }
      exercises[prev.currentExerciseIndex] = { ...exercises[prev.currentExerciseIndex], sets };
      return { ...prev, exercises };
    });

    // Start rest timer
    const restTime = currentEx.restTime || 90;
    setRestTotal(restTime);
    setRestTimer(restTime);
    setShowRest(true);
  };

  const copyPrevWeight = (setIndex: number) => {
    if (setIndex === 0) return;
    const prevSet = currentEx.sets[setIndex - 1];
    updateSet(setIndex, 'weight', prevSet.weight);
  };

  const goToExercise = (index: number) => {
    if (index < 0 || index >= activeWorkout.exercises.length) return;
    setActiveWorkout(prev => prev ? { ...prev, currentExerciseIndex: index } : prev);
    setShowRest(false);
  };

  const finishWorkout = () => {
    const completedExercises: CompletedExercise[] = activeWorkout.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map(s => ({
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
        completedAt: s.completed ? new Date().toISOString() : undefined,
      })),
    }));

    const totalVolume = completedExercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0
    );

    const completed: CompletedWorkout = {
      id: `workout-${Date.now()}`,
      templateId: activeWorkout.templateId,
      name: activeWorkout.name,
      exercises: completedExercises,
      startedAt: activeWorkout.startedAt,
      completedAt: new Date().toISOString(),
      duration: elapsed,
      totalVolume,
    };

    // Update PRs
    completedExercises.forEach(ex => {
      ex.sets.filter(s => s.completed).forEach(s => {
        updateRecord(ex.exerciseId, s.weight, s.reps);
      });
    });

    setHistory(prev => [...prev, completed]);
    setActiveWorkout(null);
    navigate('/historico');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const allCompleted = activeWorkout.exercises.every(ex => ex.sets.every(s => s.completed));
  const isLastExercise = activeWorkout.currentExerciseIndex === activeWorkout.exercises.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-14 pb-3 flex items-center justify-between">
        <button onClick={() => { setActiveWorkout(null); navigate('/treinos'); }} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{activeWorkout.name}</p>
          <p className="text-xs text-primary font-mono">{formatTime(elapsed)}</p>
        </div>
        <button
          onClick={finishWorkout}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Finalizar
        </button>
      </header>

      {/* Exercise indicator */}
      <div className="px-5 pb-3 flex items-center gap-2">
        {activeWorkout.exercises.map((_, i) => (
          <button
            key={i}
            onClick={() => goToExercise(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === activeWorkout.currentExerciseIndex ? 'bg-primary' :
              activeWorkout.exercises[i].sets.every(s => s.completed) ? 'bg-primary/40' : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      {/* Exercise Content */}
      <div className="flex-1 px-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeWorkout.currentExerciseIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Exercise name & image */}
            <div className="space-y-3">
              <div className="w-full h-40 bg-card rounded-2xl flex items-center justify-center">
                <span className="text-5xl font-bold text-muted-foreground/10">
                  {exercise?.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{exercise?.name}</h2>
                <p className="text-sm text-muted-foreground font-body">{exercise?.muscleGroup} • {exercise?.equipment}</p>
              </div>
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[40px_1fr_1fr_48px_40px] gap-2 px-2 text-xs text-muted-foreground font-body">
                <span>Série</span>
                <span className="text-center">Peso (kg)</span>
                <span className="text-center">Reps</span>
                <span></span>
                <span></span>
              </div>
              {currentEx.sets.map((set, i) => (
                <motion.div
                  key={i}
                  className={`grid grid-cols-[40px_1fr_1fr_48px_40px] gap-2 items-center rounded-xl px-2 py-2.5 transition-all ${
                    set.completed ? 'opacity-60' : 'bg-card'
                  } ${flashIndex === i ? 'animate-set-flash' : ''}`}
                >
                  <span className="text-sm font-semibold text-center text-muted-foreground">{i + 1}</span>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={set.weight || ''}
                      onChange={e => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                      disabled={set.completed}
                      placeholder="0"
                      className="w-full bg-secondary rounded-lg px-3 py-2.5 text-center text-sm font-medium outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    {i > 0 && !set.completed && (
                      <button onClick={() => copyPrevWeight(i)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps || ''}
                    onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                    disabled={set.completed}
                    placeholder={`${set.targetReps}`}
                    className="w-full bg-secondary rounded-lg px-3 py-2.5 text-center text-sm font-medium outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <span className="text-xs text-muted-foreground text-center font-body">{set.targetReps}r</span>
                  <button
                    onClick={() => !set.completed && completeSet(i)}
                    disabled={set.completed}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      set.completed ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Check size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border px-5 py-4 safe-bottom">
        {showRest ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Timer size={16} className="text-primary" /> Descanso
              </span>
              <span className="text-2xl font-bold font-mono text-primary">{formatTime(restTimer)}</span>
              <button onClick={() => setShowRest(false)} className="px-4 py-2 bg-secondary rounded-xl text-sm font-medium">
                Pular
              </button>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(restTimer / restTotal) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => goToExercise(activeWorkout.currentExerciseIndex - 1)}
              disabled={activeWorkout.currentExerciseIndex === 0}
              className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                if (isLastExercise && allCompleted) finishWorkout();
                else goToExercise(activeWorkout.currentExerciseIndex + 1);
              }}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2"
            >
              {isLastExercise ? (
                allCompleted ? 'Finalizar Treino' : 'Próximo'
              ) : (
                <>Próximo <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
