import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Timer, Copy, Plus, Trash2, MessageSquare, X, Search, Replace, Trophy, Dumbbell, Award, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveWorkout, useHistory, usePersonalRecords } from '@/hooks/useStorage';
import { getExerciseById, exercises as allExercises, muscleGroups } from '@/data/exercises';
import { CompletedWorkout, CompletedExercise, ActiveSet } from '@/types/workout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const [activeWorkout, setActiveWorkout] = useActiveWorkout();
  const [history, setHistory] = useHistory();
  const { records, updateRecord, getRecord } = usePersonalRecords();

  const [restTimer, setRestTimer] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [exerciseElapsed, setExerciseElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showReplaceExercise, setShowReplaceExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [newPR, setNewPR] = useState<{ exerciseName: string; type: string; value: string } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<CompletedWorkout | null>(null);
  const [summaryPRs, setSummaryPRs] = useState<{ exerciseName: string; type: string; value: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval>>();
  const exerciseStartRef = useRef(Date.now());

  // Redirect if no active workout
  useEffect(() => {
    if (!activeWorkout) {
      navigate('/treinos', { replace: true });
    }
  }, [activeWorkout, navigate]);

  // Elapsed timer
  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeWorkout?.startedAt]);

  // Exercise elapsed timer
  useEffect(() => {
    exerciseStartRef.current = Date.now();
    setExerciseElapsed(0);
    exerciseTimerRef.current = setInterval(() => {
      setExerciseElapsed(Math.floor((Date.now() - exerciseStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(exerciseTimerRef.current);
  }, [activeWorkout?.currentExerciseIndex]);

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

  // Auto-dismiss PR notification
  useEffect(() => {
    if (!newPR) return;
    const t = setTimeout(() => setNewPR(null), 3000);
    return () => clearTimeout(t);
  }, [newPR]);

  if (!activeWorkout) return null;

  const hasExercises = activeWorkout.exercises.length > 0;
  const currentEx = hasExercises ? activeWorkout.exercises[activeWorkout.currentExerciseIndex] : null;
  const exercise = currentEx ? getExerciseById(currentEx.exerciseId) : null;
  const totalExercises = activeWorkout.exercises.length;
  const currentIndex = activeWorkout.currentExerciseIndex;

  // Calculate real-time volume
  const liveVolume = activeWorkout.exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0
  );

  // Get previous workout data for this exercise
  const getPreviousData = (exerciseId: string) => {
    for (let i = history.length - 1; i >= 0; i--) {
      const ex = history[i].exercises.find(e => e.exerciseId === exerciseId);
      if (ex) return ex.sets.filter(s => s.completed);
    }
    return null;
  };
  const previousSets = currentEx ? getPreviousData(currentEx.exerciseId) : null;

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

  const toggleSetCompletion = (setIndex: number) => {
    if (!currentEx) return;
    const set = currentEx.sets[setIndex];

    if (set.completed) {
      // Uncomplete the set
      setActiveWorkout(prev => {
        if (!prev) return prev;
        const exercises = [...prev.exercises];
        const sets = [...exercises[prev.currentExerciseIndex].sets];
        sets[setIndex] = { ...sets[setIndex], completed: false };
        exercises[prev.currentExerciseIndex] = { ...exercises[prev.currentExerciseIndex], sets };
        return { ...prev, exercises };
      });
      return;
    }

    // Complete the set
    setFlashIndex(setIndex);
    setTimeout(() => setFlashIndex(null), 300);

    // Check for PR
    if (exercise) {
      const record = getRecord(currentEx.exerciseId);
      const weight = set.weight;
      const reps = set.reps || set.targetReps;
      const volume = weight * reps;

      if (record) {
        if (weight > record.maxWeight) {
          setNewPR({ exerciseName: exercise.name, type: 'Peso', value: `${weight}kg (anterior: ${record.maxWeight}kg)` });
        } else if (reps > record.maxReps) {
          setNewPR({ exerciseName: exercise.name, type: 'Repetições', value: `${reps} reps (anterior: ${record.maxReps})` });
        } else if (volume > record.maxVolume) {
          setNewPR({ exerciseName: exercise.name, type: 'Volume', value: `${volume}kg (anterior: ${record.maxVolume}kg)` });
        }
      }
    }

    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = [...exercises[prev.currentExerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], completed: true };
      // Auto-fill next set with same weight
      if (setIndex + 1 < sets.length && !sets[setIndex + 1].completed && sets[setIndex + 1].weight === 0) {
        sets[setIndex + 1] = {
          ...sets[setIndex + 1],
          weight: sets[setIndex].weight,
        };
      }
      exercises[prev.currentExerciseIndex] = { ...exercises[prev.currentExerciseIndex], sets };
      return { ...prev, exercises };
    });

    const restTime = currentEx?.restTime || 90;
    setRestTotal(restTime);
    setRestTimer(restTime);
    setShowRest(true);
  };

  const copyPrevWeight = (setIndex: number) => {
    if (setIndex === 0 && previousSets && previousSets[0]) {
      updateSet(0, 'weight', previousSets[0].weight);
      if (previousSets[0].reps) updateSet(0, 'reps', previousSets[0].reps);
      return;
    }
    if (setIndex > 0 && currentEx) {
      const prevSet = currentEx.sets[setIndex - 1];
      updateSet(setIndex, 'weight', prevSet.weight);
    }
  };

  const addSet = () => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const currentSets = exercises[prev.currentExerciseIndex].sets;
      const lastSet = currentSets[currentSets.length - 1];
      const newSet: ActiveSet = {
        weight: lastSet?.weight || 0,
        reps: 0,
        targetReps: lastSet?.targetReps || 10,
        completed: false,
      };
      exercises[prev.currentExerciseIndex] = {
        ...exercises[prev.currentExerciseIndex],
        sets: [...currentSets, newSet],
      };
      return { ...prev, exercises };
    });
  };

  const removeSet = (setIndex: number) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = exercises[prev.currentExerciseIndex].sets;
      if (sets.length <= 1) return prev;
      exercises[prev.currentExerciseIndex] = {
        ...exercises[prev.currentExerciseIndex],
        sets: sets.filter((_, i) => i !== setIndex),
      };
      return { ...prev, exercises };
    });
  };

  const removeExercise = () => {
    setActiveWorkout(prev => {
      if (!prev || prev.exercises.length <= 1) return prev;
      const exercises = prev.exercises.filter((_, i) => i !== prev.currentExerciseIndex);
      const newIndex = Math.min(prev.currentExerciseIndex, exercises.length - 1);
      return { ...prev, exercises, currentExerciseIndex: newIndex };
    });
  };

  const addExerciseToWorkout = (exerciseId: string) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exerciseId,
            restTime: 90,
            sets: [
              { weight: 0, reps: 0, targetReps: 10, completed: false },
              { weight: 0, reps: 0, targetReps: 10, completed: false },
              { weight: 0, reps: 0, targetReps: 10, completed: false },
            ],
          },
        ],
      };
    });
    setShowAddExercise(false);
    setExerciseSearch('');
  };

  const replaceExercise = (exerciseId: string) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      exercises[prev.currentExerciseIndex] = {
        ...exercises[prev.currentExerciseIndex],
        exerciseId,
        sets: exercises[prev.currentExerciseIndex].sets.map(s => ({ ...s, completed: false, weight: 0, reps: 0 })),
      };
      return { ...prev, exercises };
    });
    setShowReplaceExercise(false);
    setExerciseSearch('');
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
        reps: s.reps || s.targetReps,
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
      notes: workoutNotes || undefined,
    };

    const prs: { exerciseName: string; type: string; value: string }[] = [];
    completedExercises.forEach(ex => {
      const exInfo = getExerciseById(ex.exerciseId);
      const record = getRecord(ex.exerciseId);
      ex.sets.filter(s => s.completed).forEach(s => {
        if (exInfo) {
          if (record) {
            if (s.weight > record.maxWeight) prs.push({ exerciseName: exInfo.name, type: 'Peso', value: `${s.weight}kg (anterior: ${record.maxWeight}kg)` });
            if (s.reps > record.maxReps) prs.push({ exerciseName: exInfo.name, type: 'Reps', value: `${s.reps} (anterior: ${record.maxReps})` });
            if (s.weight * s.reps > record.maxVolume) prs.push({ exerciseName: exInfo.name, type: 'Volume', value: `${s.weight * s.reps}kg (anterior: ${record.maxVolume}kg)` });
          }
          updateRecord(ex.exerciseId, s.weight, s.reps);
        }
      });
    });

    setHistory(prev => [...prev, completed]);
    setWorkoutSummary(completed);
    setSummaryPRs(prs);
    setShowSummary(true);
  };

  const closeSummary = () => {
    setShowSummary(false);
    setActiveWorkout(null);
    navigate('/historico');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const allCompleted = hasExercises && activeWorkout.exercises.every(ex => ex.sets.every(s => s.completed));
  const isLastExercise = currentIndex === totalExercises - 1;

  const filteredExercises = allExercises.filter(e => {
    if (exerciseSearch && !e.name.toLowerCase().includes(exerciseSearch.toLowerCase())) return false;
    if (muscleFilter && e.muscleGroup !== muscleFilter) return false;
    return true;
  });

  const ExercisePickerContent = ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div className="space-y-3 mt-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={exerciseSearch}
          onChange={e => setExerciseSearch(e.target.value)}
          className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setMuscleFilter('')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!muscleFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          Todos
        </button>
        {muscleGroups.map(mg => (
          <button key={mg} onClick={() => setMuscleFilter(mg)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${muscleFilter === mg ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {mg}
          </button>
        ))}
      </div>
      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {filteredExercises.map(ex => (
          <button key={ex.id} onClick={() => onSelect(ex.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-left">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-primary text-sm font-bold">
              {ex.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{ex.name}</p>
              <p className="text-xs text-muted-foreground font-body">{ex.muscleGroup}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Empty exercises state (free workout start)
  if (!hasExercises) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-5 pt-14 pb-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => { setActiveWorkout(null); navigate('/treinos'); }} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold">{activeWorkout.name}</p>
              <p className="text-xs text-primary font-mono">{formatTime(elapsed)}</p>
            </div>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-card mx-auto flex items-center justify-center">
              <Dumbbell size={32} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Treino Livre</h2>
              <p className="text-muted-foreground font-body text-sm">Adicione exercícios para começar seu treino</p>
            </div>
            <button
              onClick={() => setShowAddExercise(true)}
              className="bg-primary text-primary-foreground rounded-xl px-6 py-3.5 font-semibold flex items-center justify-center gap-2 mx-auto"
            >
              <Plus size={18} /> Adicionar Exercício
            </button>
          </div>
        </div>

        {/* Add Exercise Dialog */}
        <Dialog open={showAddExercise} onOpenChange={v => { setShowAddExercise(v); if (!v) { setExerciseSearch(''); setMuscleFilter(''); } }}>
          <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Exercício</DialogTitle>
            </DialogHeader>
            <ExercisePickerContent onSelect={addExerciseToWorkout} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* PR Notification */}
      <AnimatePresence>
        {newPR && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <div className="max-w-lg mx-auto bg-primary text-primary-foreground rounded-2xl p-4 flex items-center gap-3 shadow-lg">
              <Trophy size={24} />
              <div className="flex-1">
                <p className="font-bold text-sm">🔥 Novo Recorde Pessoal!</p>
                <p className="text-xs opacity-90">{newPR.exerciseName} — {newPR.type}: {newPR.value}</p>
              </div>
              <button onClick={() => setNewPR(null)}><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-5 pt-14 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => { setActiveWorkout(null); navigate('/treinos'); }} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">{activeWorkout.name}</p>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-primary">{formatTime(elapsed)}</span>
              <span className="text-muted-foreground">Ex: {formatTime(exerciseElapsed)}</span>
            </div>
          </div>
          <button
            onClick={finishWorkout}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Finalizar
          </button>
        </div>
      </header>

      {/* Live Stats Bar */}
      <div className="px-5 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-body">
              Exercício {currentIndex + 1} de {totalExercises}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-primary font-body">
                Volume: {liveVolume > 1000 ? `${(liveVolume / 1000).toFixed(1)}t` : `${liveVolume}kg`}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setShowNotes(true)} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground">
                  <MessageSquare size={14} />
                </button>
                <button onClick={() => setShowAddExercise(true)} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeWorkout.exercises.map((_, i) => (
              <button
                key={i}
                onClick={() => goToExercise(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-primary' :
                  activeWorkout.exercises[i].sets.every(s => s.completed) ? 'bg-primary/40' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="flex-1 px-5 pb-32">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Exercise name & actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{exercise?.name}</h2>
                  <p className="text-sm text-muted-foreground font-body">{exercise?.muscleGroup} • {exercise?.equipment}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setShowReplaceExercise(true)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-muted-foreground" title="Substituir">
                    <Replace size={14} />
                  </button>
                  {totalExercises > 1 && (
                    <button onClick={removeExercise} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-destructive" title="Remover">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Previous workout data */}
              {previousSets && previousSets.length > 0 && (
                <div className="bg-card/50 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-body font-medium">Treino anterior</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {previousSets.map((s, i) => (
                      <span key={i} className="text-xs text-secondary-foreground font-body">
                        S{i + 1}: {s.weight}kg × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sets */}
              <div className="space-y-2">
                <div className="grid grid-cols-[36px_1fr_1fr_44px_36px] gap-2 px-2 text-xs text-muted-foreground font-body">
                  <span>Série</span>
                  <span className="text-center">Peso (kg)</span>
                  <span className="text-center">Reps</span>
                  <span></span>
                  <span></span>
                </div>
                {currentEx.sets.map((set, i) => (
                  <motion.div
                    key={i}
                    layout
                    className={`grid grid-cols-[36px_1fr_1fr_44px_36px] gap-2 items-center rounded-xl px-2 py-2 transition-all ${
                      set.completed ? 'bg-primary/5 border border-primary/20' : 'bg-card'
                    } ${flashIndex === i ? 'animate-set-flash' : ''}`}
                  >
                    <span className="text-sm font-semibold text-center text-muted-foreground">{i + 1}</span>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight || ''}
                        onChange={e => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                        placeholder={previousSets?.[i] ? `${previousSets[i].weight}` : '0'}
                        className={`w-full bg-secondary rounded-lg px-3 py-2.5 text-center text-sm font-medium outline-none focus:ring-2 focus:ring-ring ${set.completed ? 'text-primary' : ''}`}
                      />
                      {!set.completed && (
                        <button onClick={() => copyPrevWeight(i)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
                          <Copy size={11} />
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps || ''}
                      onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                      placeholder={`${set.targetReps}`}
                      className={`w-full bg-secondary rounded-lg px-3 py-2.5 text-center text-sm font-medium outline-none focus:ring-2 focus:ring-ring ${set.completed ? 'text-primary' : ''}`}
                    />
                    <button
                      onClick={() => toggleSetCompletion(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        set.completed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => removeSet(i)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}

                {/* Add Set Button */}
                <button
                  onClick={addSet}
                  className="w-full border border-dashed border-border rounded-xl py-2.5 text-muted-foreground text-xs font-body flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={14} /> Adicionar Série
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto px-5 py-4">
          {showRest ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Timer size={16} className="text-primary" /> Descanso
                </span>
                <span className="text-2xl font-bold font-mono text-primary">{formatTime(restTimer)}</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(restTimer / restTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setRestTimer(prev => Math.max(0, prev - 15))} className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium">-15s</button>
                <button onClick={() => setRestTimer(prev => prev + 15)} className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium">+15s</button>
                <button onClick={() => setRestTimer(prev => prev + 60)} className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium">+1min</button>
                <button onClick={() => setShowRest(false)} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">Pular</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => goToExercise(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  if (isLastExercise && allCompleted) finishWorkout();
                  else goToExercise(currentIndex + 1);
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

      {/* Notes Dialog */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Notas do Treino</DialogTitle>
          </DialogHeader>
          <textarea
            value={workoutNotes}
            onChange={e => setWorkoutNotes(e.target.value)}
            placeholder="Ex: treino pesado hoje, aumentar peso semana que vem..."
            className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm min-h-[120px] resize-none"
          />
        </DialogContent>
      </Dialog>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddExercise} onOpenChange={v => { setShowAddExercise(v); if (!v) { setExerciseSearch(''); setMuscleFilter(''); } }}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Exercício</DialogTitle>
          </DialogHeader>
          <ExercisePickerContent onSelect={addExerciseToWorkout} />
        </DialogContent>
      </Dialog>

      {/* Replace Exercise Dialog */}
      <Dialog open={showReplaceExercise} onOpenChange={v => { setShowReplaceExercise(v); if (!v) { setExerciseSearch(''); setMuscleFilter(''); } }}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Substituir Exercício</DialogTitle>
          </DialogHeader>
          <ExercisePickerContent onSelect={replaceExercise} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
