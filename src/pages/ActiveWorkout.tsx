import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, ChevronRight, ChevronLeft, Timer, Copy, Plus, Trash2, MessageSquare, X, Search, Replace, Trophy, Dumbbell, Award, Clock, TrendingUp, Sparkles, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useActiveWorkout, useHistory, usePersonalRecords } from '@/hooks/useStorage';
import { getExerciseById, getAllExercises, muscleGroups } from '@/data/exercises';
import { CompletedWorkout, CompletedExercise, ActiveSet } from '@/types/workout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { haptic } from '@/lib/haptic';
import { apiFetch } from '@/lib/api';
import { suggestWeight } from '@/lib/workoutAnalysis';

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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryPreviousWorkout, setSummaryPreviousWorkout] = useState<CompletedWorkout | null>(null);
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
        if (prev <= 1) {
          setShowRest(false);
          haptic('success');
          return 0;
        }
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
  const weightSuggestion = currentEx ? suggestWeight(currentEx.exerciseId, history) : null;

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
    haptic('medium');
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
    haptic('light');
    setActiveWorkout(prev => {
      if (!prev) return prev;
      // Auto-fill sets from previous workout for the destination exercise
      const exercises = [...prev.exercises];
      const destEx = exercises[index];
      const prevData = getPreviousData(destEx.exerciseId);
      if (prevData && prevData.length > 0) {
        const newSets = destEx.sets.map((s, si) => {
          if (!s.completed && s.weight === 0) {
            const ref = prevData[si] || prevData[prevData.length - 1];
            return { ...s, weight: ref.weight, reps: ref.reps || s.targetReps };
          }
          return s;
        });
        exercises[index] = { ...destEx, sets: newSets };
      }
      return { ...prev, exercises, currentExerciseIndex: index };
    });
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

    // Find previous workout with similar exercises for AI comparison
    const previousWorkout = history.length > 0 ? history[history.length - 1] : null;

    setHistory(prev => [...prev, completed]);
    setWorkoutSummary(completed);
    setSummaryPRs(prs);
    setSummaryPreviousWorkout(previousWorkout);
    setAiAnalysis(null);
    setShowSummary(true);
  };

  const analyzeWorkout = async () => {
    if (!workoutSummary || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const workoutPayload = {
        name: workoutSummary.name,
        duration: workoutSummary.duration,
        totalVolume: workoutSummary.totalVolume,
        exercises: workoutSummary.exercises.map(ex => {
          const exInfo = getExerciseById(ex.exerciseId);
          return {
            name: exInfo?.name || ex.exerciseId,
            muscle: exInfo?.muscleGroup || '',
            sets: ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps })),
          };
        }),
      };

      const previousPayload = summaryPreviousWorkout ? {
        name: summaryPreviousWorkout.name,
        totalVolume: summaryPreviousWorkout.totalVolume,
        exercises: summaryPreviousWorkout.exercises.map(ex => {
          const exInfo = getExerciseById(ex.exerciseId);
          return {
            name: exInfo?.name || ex.exerciseId,
            sets: ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps })),
          };
        }),
      } : undefined;

      const resp = await apiFetch('/api/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout: workoutPayload, previousWorkout: previousPayload, prs: summaryPRs }),
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const data = await resp.json();
      setAiAnalysis(data.analysis || 'Análise indisponível.');
    } catch (e) {
      setAiAnalysis('❌ Não foi possível gerar a análise agora. Tente mais tarde.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setActiveWorkout(null);
    navigate('/historico');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const allCompleted = hasExercises && activeWorkout.exercises.every(ex => ex.sets.every(s => s.completed));
  const isLastExercise = currentIndex === totalExercises - 1;

  const allExercises = getAllExercises();
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
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <div className="max-w-lg mx-auto rounded-2xl p-4 flex items-center gap-3 shadow-premium" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' }}>
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Trophy size={20} className="text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-primary-foreground">🔥 Novo Recorde!</p>
                <p className="text-xs text-primary-foreground/80">{newPR.exerciseName} — {newPR.type}: {newPR.value}</p>
              </div>
              <button onClick={() => setNewPR(null)} className="text-primary-foreground/60"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-5 pt-14 pb-3 glass-strong border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => { setActiveWorkout(null); navigate('/treinos'); }} className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold tracking-tight">{activeWorkout.name}</p>
            <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
              <span className="text-primary font-semibold">{formatTime(elapsed)}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Ex {formatTime(exerciseElapsed)}</span>
            </div>
          </div>
          <button
            onClick={finishWorkout}
            className="px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))', color: 'hsl(var(--primary-foreground))' }}
          >
            Finalizar
          </button>
        </div>
      </header>

      {/* Live Stats Bar */}
      <div className="px-5 py-3 border-b border-border/20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-muted-foreground font-body">
              Exercício <span className="text-foreground font-semibold">{currentIndex + 1}</span> de {totalExercises}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg">
                <TrendingUp size={12} className="text-primary" />
                <span className="text-xs font-bold text-primary font-body">
                  {liveVolume > 1000 ? `${(liveVolume / 1000).toFixed(1)}t` : `${liveVolume}kg`}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowNotes(true)} className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare size={14} />
                </button>
                <button onClick={() => setShowAddExercise(true)} className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeWorkout.exercises.map((ex, i) => {
              const done = ex.sets.every(s => s.completed);
              const partial = ex.sets.some(s => s.completed);
              return (
                <button
                  key={i}
                  onClick={() => goToExercise(i)}
                  className={`relative flex-1 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-primary h-2' :
                    done ? 'bg-primary/50 h-1.5' :
                    partial ? 'bg-primary/25 h-1.5' : 'bg-secondary h-1.5'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="flex-1 px-5 pb-32 pt-4">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
              className="space-y-4"
            >
              {/* Exercise name & actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold tracking-tight">{exercise?.name}</h2>
                  <p className="text-sm text-muted-foreground font-body mt-0.5">{exercise?.muscleGroup} • {exercise?.equipment}</p>
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

              {/* Previous workout data + weight suggestion */}
              <div className="space-y-2">
                {previousSets && previousSets.length > 0 && (
                  <div className="bg-secondary/50 rounded-xl px-4 py-3 space-y-1 border border-border/20">
                    <p className="text-xs text-muted-foreground font-body font-medium">Último treino</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {previousSets.map((s, i) => (
                        <span key={i} className="text-xs text-secondary-foreground font-body">
                          S{i + 1}: {s.weight}kg × {s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {weightSuggestion && weightSuggestion.suggested > 0 && (
                  <div className={`rounded-xl px-4 py-2.5 flex items-center gap-2.5 border ${
                    weightSuggestion.trend === 'up'
                      ? 'bg-primary/5 border-primary/20'
                      : weightSuggestion.trend === 'down'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-secondary/40 border-border/20'
                  }`}>
                    {weightSuggestion.trend === 'up' ? (
                      <TrendingUp size={14} className="text-primary shrink-0" />
                    ) : weightSuggestion.trend === 'down' ? (
                      <TrendingDown size={14} className="text-orange-400 shrink-0" />
                    ) : (
                      <Minus size={14} className="text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-xs font-body text-muted-foreground">Sugestão: </span>
                      <span className={`text-xs font-bold ${
                        weightSuggestion.trend === 'up' ? 'text-primary' : 'text-foreground'
                      }`}>{weightSuggestion.suggested}kg</span>
                      <span className="text-[10px] text-muted-foreground font-body ml-1.5">— {weightSuggestion.reason}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sets */}
              <div className="space-y-2">
                <div className="grid grid-cols-[36px_1fr_1fr_44px_36px] gap-2 px-2 text-[10px] text-muted-foreground font-body uppercase tracking-wider font-semibold">
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
                    className={`grid grid-cols-[36px_1fr_1fr_44px_36px] gap-2 items-center rounded-xl px-2 py-2.5 transition-all duration-200 ${
                      set.completed ? 'bg-primary/8 border border-primary/20' : 'card-premium'
                    } ${flashIndex === i ? 'animate-set-flash' : ''}`}
                  >
                    <span className={`text-sm font-bold text-center ${set.completed ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight || ''}
                        onChange={e => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                        placeholder={previousSets?.[i] ? `${previousSets[i].weight}` : '0'}
                        className={`w-full bg-secondary/80 rounded-lg px-3 py-2.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-ring transition-all ${set.completed ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                      />
                      {!set.completed && (
                        <button onClick={() => copyPrevWeight(i)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
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
                      className={`w-full bg-secondary/80 rounded-lg px-3 py-2.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-ring transition-all ${set.completed ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                    />
                    <button
                      onClick={() => toggleSetCompletion(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        set.completed
                          ? 'text-primary-foreground'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                      style={set.completed ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' } : {}}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => removeSet(i)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-destructive transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}

                {/* Add Set Button */}
                <button
                  onClick={addSet}
                  className="w-full border border-dashed border-border/60 rounded-xl py-3 text-muted-foreground text-xs font-body flex items-center justify-center gap-1.5 hover:border-primary/40 hover:text-primary transition-all"
                >
                  <Plus size={14} /> Adicionar Série
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/30 safe-bottom">
        <div className="max-w-lg mx-auto px-5 py-4">
          {showRest ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Timer size={16} className="text-primary" />
                  </div>
                  Descanso
                </span>
                <span className="text-3xl font-extrabold font-mono text-primary tracking-tight">{formatTime(restTimer)}</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(restTimer / restTotal) * 100}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))' }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setRestTimer(prev => Math.max(0, prev - 15))} className="px-3.5 py-2 bg-secondary rounded-xl text-xs font-semibold active:scale-95 transition-transform">-15s</button>
                <button onClick={() => setRestTimer(prev => prev + 15)} className="px-3.5 py-2 bg-secondary rounded-xl text-xs font-semibold active:scale-95 transition-transform">+15s</button>
                <button onClick={() => setRestTimer(prev => prev + 60)} className="px-3.5 py-2 bg-secondary rounded-xl text-xs font-semibold active:scale-95 transition-transform">+1min</button>
                <button onClick={() => setShowRest(false)} className="px-5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform text-primary-foreground" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' }}>Pular</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => goToExercise(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-20 active:scale-95 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  if (isLastExercise && allCompleted) finishWorkout();
                  else goToExercise(currentIndex + 1);
                }}
                className="flex-1 rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform text-primary-foreground"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))', boxShadow: '0 4px 16px -4px hsl(var(--primary) / 0.3)' }}
              >
                {isLastExercise ? (
                  allCompleted ? '✨ Finalizar Treino' : 'Próximo'
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

      {/* Post-Workout Summary */}
      <Dialog open={showSummary} onOpenChange={() => closeSummary()}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">🎉 Treino Finalizado!</DialogTitle>
          </DialogHeader>
          {workoutSummary && (
            <div className="space-y-5 mt-2">
              <h3 className="text-center font-bold text-lg">{workoutSummary.name}</h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-xl p-3 text-center space-y-1">
                  <Clock size={16} className="text-primary mx-auto" />
                  <p className="text-lg font-bold">{formatTime(workoutSummary.duration)}</p>
                  <p className="text-[10px] text-muted-foreground font-body">duração</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 text-center space-y-1">
                  <TrendingUp size={16} className="text-primary mx-auto" />
                  <p className="text-lg font-bold">{workoutSummary.totalVolume > 1000 ? `${(workoutSummary.totalVolume / 1000).toFixed(1)}t` : `${workoutSummary.totalVolume}kg`}</p>
                  <p className="text-[10px] text-muted-foreground font-body">volume</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 text-center space-y-1">
                  <Dumbbell size={16} className="text-primary mx-auto" />
                  <p className="text-lg font-bold">{workoutSummary.exercises.length}</p>
                  <p className="text-[10px] text-muted-foreground font-body">exercícios</p>
                </div>
              </div>

              {/* Muscles worked */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Músculos Trabalhados</h4>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(workoutSummary.exercises.map(e => getExerciseById(e.exerciseId)?.muscleGroup).filter(Boolean))].map(m => (
                    <span key={m} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium">{m}</span>
                  ))}
                </div>
              </div>

              {/* PRs */}
              {summaryPRs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-primary" />
                    <h4 className="font-semibold text-sm">Recordes Batidos!</h4>
                  </div>
                  <div className="space-y-1.5">
                    {summaryPRs.map((pr, i) => (
                      <div key={i} className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
                        <span className="font-medium">{pr.exerciseName}</span>
                        <span className="text-muted-foreground"> — {pr.type}: </span>
                        <span className="text-primary font-semibold">{pr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises detail */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Detalhes</h4>
                {workoutSummary.exercises.map((ex, i) => {
                  const exInfo = getExerciseById(ex.exerciseId);
                  const completedSets = ex.sets.filter(s => s.completed);
                  const vol = completedSets.reduce((s, set) => s + set.weight * set.reps, 0);
                  return (
                    <div key={i} className="bg-secondary rounded-xl px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{exInfo?.name}</p>
                        <p className="text-xs text-muted-foreground font-body">{completedSets.length} séries completadas</p>
                      </div>
                      <span className="text-xs text-primary font-medium">{vol}kg</span>
                    </div>
                  );
                })}
              </div>

              {/* AI Analysis */}
              {aiAnalysis ? (
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-primary shrink-0" />
                    <p className="text-sm font-semibold text-primary">Análise do FitAI</p>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none text-xs text-foreground font-body leading-relaxed [&_strong]:text-foreground [&_ul]:pl-4 [&_li]:my-0.5">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <button
                  onClick={analyzeWorkout}
                  disabled={isAnalyzing}
                  className="w-full bg-primary/10 border border-primary/20 text-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  {isAnalyzing ? 'Analisando com IA...' : 'Analisar Treino com IA'}
                </button>
              )}

              <button
                onClick={closeSummary}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold"
              >
                Ver Histórico
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
