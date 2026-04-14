import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Edit3, ChevronRight, ChevronDown, ChevronUp, FolderOpen, Zap, Minus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useTemplates, useActiveWorkout, useFolders } from '@/hooks/useStorage';
import { WorkoutTemplate, WorkoutExercise, ActiveWorkout, SetConfig } from '@/types/workout';
import { getAllExercises, getExerciseById, muscleGroups } from '@/data/exercises';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Workouts() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useTemplates();
  const [, setActiveWorkout] = useActiveWorkout();
  const [folders] = useFolders();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('');
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const startWorkout = (template: WorkoutTemplate) => {
    const active: ActiveWorkout = {
      templateId: template.id,
      name: template.name,
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      exercises: template.exercises.map(e => ({
        exerciseId: e.exerciseId,
        restTime: e.restTime,
        sets: e.sets.map(s => ({
          weight: s.weight,
          reps: 0,
          targetReps: s.targetReps,
          completed: false,
        })),
      })),
    };
    setActiveWorkout(active);
    navigate('/treino-ativo');
  };

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

  const openCreate = () => {
    setName('');
    setSelectedExercises([]);
    setSelectedFolder('');
    setEditingTemplate(null);
    setExpandedExercise(null);
    setShowCreate(true);
  };

  const openEdit = (t: WorkoutTemplate) => {
    setName(t.name);
    setSelectedExercises(t.exercises.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s })) })));
    setSelectedFolder(t.folder || '');
    setEditingTemplate(t);
    setExpandedExercise(null);
    setShowCreate(true);
  };

  const saveTemplate = () => {
    if (!name.trim() || selectedExercises.length === 0) return;
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, name, exercises: selectedExercises, folder: selectedFolder || undefined } : t));
    } else {
      const template: WorkoutTemplate = {
        id: `tmpl-${Date.now()}`,
        name,
        exercises: selectedExercises,
        createdAt: new Date().toISOString(),
        folder: selectedFolder || undefined,
      };
      setTemplates(prev => [...prev, template]);
    }
    setShowCreate(false);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const addExercise = (exerciseId: string) => {
    setSelectedExercises(prev => [
      ...prev,
      { exerciseId, sets: [{ targetReps: 10, weight: 0 }, { targetReps: 10, weight: 0 }, { targetReps: 10, weight: 0 }], restTime: 90 },
    ]);
    setShowExercisePicker(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
    if (expandedExercise === index) setExpandedExercise(null);
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;
    setSelectedExercises(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
    if (expandedExercise === index) setExpandedExercise(newIndex);
  };

  // Edit sets/reps/rest for an exercise in the template editor
  const updateExerciseSets = (exIndex: number, sets: SetConfig[]) => {
    setSelectedExercises(prev => prev.map((e, i) => i === exIndex ? { ...e, sets } : e));
  };

  const updateExerciseRest = (exIndex: number, restTime: number) => {
    setSelectedExercises(prev => prev.map((e, i) => i === exIndex ? { ...e, restTime } : e));
  };

  const addSetToExercise = (exIndex: number) => {
    const ex = selectedExercises[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    updateExerciseSets(exIndex, [...ex.sets, { targetReps: lastSet?.targetReps || 10, weight: lastSet?.weight || 0 }]);
  };

  const removeSetFromExercise = (exIndex: number, setIndex: number) => {
    const ex = selectedExercises[exIndex];
    if (ex.sets.length <= 1) return;
    updateExerciseSets(exIndex, ex.sets.filter((_, i) => i !== setIndex));
  };

  const updateSetField = (exIndex: number, setIndex: number, field: 'targetReps' | 'weight', value: number) => {
    const ex = selectedExercises[exIndex];
    const sets = ex.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s);
    updateExerciseSets(exIndex, sets);
  };

  const allExercises = getAllExercises();
  const filteredExercises = allExercises.filter(e => {
    if (muscleFilter && e.muscleGroup !== muscleFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const usedFolders = [...new Set(templates.map(t => t.folder || 'Sem Pasta').filter(Boolean))];
  const displayTemplates = activeFolder
    ? templates.filter(t => (t.folder || 'Sem Pasta') === activeFolder)
    : templates;

  return (
    <PageShell title="Treinos" rightAction={
      <button onClick={openCreate} className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary active:scale-95 transition-transform hover:bg-primary/25">
        <Plus size={22} />
      </button>
    }>
      <div className="space-y-6 max-w-lg mx-auto pt-2">
        {/* Quick start hero */}
        <button
          onClick={startFreeWorkout}
          className="hero-section w-full rounded-2xl overflow-hidden card-interactive"
          style={{ height: '110px' }}
        >
          <img src="/images/hero-lift.png" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" style={{ filter: 'brightness(0.4)' }} />
          <div className="hero-img-overlay" />
          <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
            <div className="text-left">
              <p className="text-white font-black text-2xl tracking-tight">Treino Livre</p>
              <p className="text-white/70 font-body text-sm mt-0.5 font-medium">Sem rotina, treino rápido</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/90 flex items-center justify-center shadow-glow-strong">
              <Zap size={28} className="text-primary-foreground" fill="currentColor" />
            </div>
          </div>
        </button>

        {/* Folder Tabs */}
        {usedFolders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveFolder('')}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${!activeFolder ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              Todos
            </button>
            {usedFolders.map(f => (
              <button
                key={f}
                onClick={() => setActiveFolder(activeFolder === f ? '' : f)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${activeFolder === f ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
              >
                <FolderOpen size={16} /> {f}
              </button>
            ))}
          </div>
        )}

        {/* Templates */}
        <div className="space-y-4">
        <AnimatePresence>
          {displayTemplates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-premium rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-xl tracking-tight leading-tight">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                      {t.exercises.length} EXERCÍCIOS
                    </span>
                    {t.folder && (
                      <span className="bg-secondary text-muted-foreground px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                        {t.folder}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button onClick={() => openEdit(t)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors active:scale-95">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors active:scale-95">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {t.exercises.slice(0, 3).map((e, j) => {
                  const ex = getExerciseById(e.exerciseId);
                  return ex ? (
                    <div key={j} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary/80 shrink-0" />
                      <span className="text-secondary-foreground font-semibold truncate">{ex.name}</span>
                      <span className="text-muted-foreground font-bold ml-auto shrink-0 bg-secondary px-2 py-0.5 rounded-md">{e.sets.length}×{e.sets[0]?.targetReps || 10}</span>
                    </div>
                  ) : null;
                })}
                {t.exercises.length > 3 && (
                  <p className="text-xs text-muted-foreground font-bold pl-5 pt-1">+{t.exercises.length - 3} MAIS</p>
                )}
              </div>

              <button
                onClick={() => startWorkout(t)}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-base shadow-glow"
              >
                <Play size={20} fill="currentColor" />
                Iniciar Rotina
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        </div>

        {templates.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto flex items-center justify-center shadow-inner">
              <Plus size={32} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-xl font-bold">Nenhuma Rotina</p>
              <p className="text-sm text-muted-foreground font-body mt-1">Crie sua primeira rotina de treino estruturada</p>
            </div>
            <button onClick={openCreate} className="bg-primary text-primary-foreground rounded-xl px-8 py-3.5 font-bold shadow-glow active:scale-95 transition-transform">
              Criar Nova Rotina
            </button>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Rotina' : 'Nova Rotina'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <input
              type="text"
              placeholder="Nome do treino (ex: Push, Treino A)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body"
            />

            <input
              type="text"
              placeholder="Pasta (opcional: Hipertrofia, Força...)"
              value={selectedFolder}
              onChange={e => setSelectedFolder(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm"
            />

            <div className="space-y-2">
              {selectedExercises.map((ex, i) => {
                const exercise = getExerciseById(ex.exerciseId);
                const isExpanded = expandedExercise === i;
                return (
                  <div key={i} className="bg-secondary rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <button onClick={() => setExpandedExercise(isExpanded ? null : i)} className="flex-1 text-left flex items-center gap-2">
                        <div>
                          <p className="font-medium text-sm">{exercise?.name}</p>
                          <p className="text-xs text-muted-foreground font-body">{ex.sets.length} séries • {ex.restTime}s descanso</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveExercise(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground disabled:opacity-20">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveExercise(i, 1)} disabled={i === selectedExercises.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground disabled:opacity-20">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => setExpandedExercise(isExpanded ? null : i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button onClick={() => removeExercise(i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded editor */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-3 space-y-3 overflow-hidden"
                        >
                          {/* Rest time */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-body">Descanso (seg)</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateExerciseRest(i, Math.max(0, ex.restTime - 15))} className="w-7 h-7 rounded-lg bg-card flex items-center justify-center text-muted-foreground"><Minus size={12} /></button>
                              <span className="text-sm font-medium w-10 text-center">{ex.restTime}s</span>
                              <button onClick={() => updateExerciseRest(i, ex.restTime + 15)} className="w-7 h-7 rounded-lg bg-card flex items-center justify-center text-muted-foreground"><Plus size={12} /></button>
                            </div>
                          </div>

                          {/* Sets */}
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-[40px_1fr_1fr_28px] gap-2 text-xs text-muted-foreground font-body">
                              <span>Série</span>
                              <span className="text-center">Reps</span>
                              <span className="text-center">Peso (kg)</span>
                              <span></span>
                            </div>
                            {ex.sets.map((set, si) => (
                              <div key={si} className="grid grid-cols-[40px_1fr_1fr_28px] gap-2 items-center">
                                <span className="text-xs font-medium text-center text-muted-foreground">{si + 1}</span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={set.targetReps || ''}
                                  onChange={e => updateSetField(i, si, 'targetReps', parseInt(e.target.value) || 0)}
                                  className="w-full bg-card rounded-lg px-2 py-1.5 text-center text-xs font-medium outline-none focus:ring-1 focus:ring-ring"
                                />
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  value={set.weight || ''}
                                  onChange={e => updateSetField(i, si, 'weight', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full bg-card rounded-lg px-2 py-1.5 text-center text-xs font-medium outline-none focus:ring-1 focus:ring-ring"
                                />
                                <button onClick={() => removeSetFromExercise(i, si)} disabled={ex.sets.length <= 1} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-20">
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => addSetToExercise(i)}
                            className="w-full border border-dashed border-border rounded-lg py-1.5 text-muted-foreground text-xs font-body flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus size={12} /> Série
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowExercisePicker(true)}
              className="w-full border border-dashed border-border rounded-xl py-3 text-muted-foreground text-sm font-body flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Adicionar Exercício
            </button>

            <button
              onClick={saveTemplate}
              disabled={!name.trim() || selectedExercises.length === 0}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold disabled:opacity-50"
            >
              Salvar Rotina
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Picker Dialog */}
      <Dialog open={showExercisePicker} onOpenChange={setShowExercisePicker}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Exercício</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <input
              type="text"
              placeholder="Buscar exercício..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <button
                onClick={() => setMuscleFilter('')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!muscleFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                Todos
              </button>
              {muscleGroups.map(mg => (
                <button
                  key={mg}
                  onClick={() => setMuscleFilter(mg)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${muscleFilter === mg ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                >
                  {mg}
                </button>
              ))}
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{ex.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{ex.muscleGroup} • {ex.equipment}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
