import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Edit3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useTemplates, useActiveWorkout } from '@/hooks/useStorage';
import { WorkoutTemplate, WorkoutExercise, ActiveWorkout, ActiveSet } from '@/types/workout';
import { exercises as allExercises, getExerciseById, muscleGroups } from '@/data/exercises';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Workouts() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useTemplates();
  const [, setActiveWorkout] = useActiveWorkout();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');

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

  const openCreate = () => {
    setName('');
    setSelectedExercises([]);
    setEditingTemplate(null);
    setShowCreate(true);
  };

  const openEdit = (t: WorkoutTemplate) => {
    setName(t.name);
    setSelectedExercises([...t.exercises]);
    setEditingTemplate(t);
    setShowCreate(true);
  };

  const saveTemplate = () => {
    if (!name.trim() || selectedExercises.length === 0) return;
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, name, exercises: selectedExercises } : t));
    } else {
      const template: WorkoutTemplate = {
        id: `tmpl-${Date.now()}`,
        name,
        exercises: selectedExercises,
        createdAt: new Date().toISOString(),
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
  };

  const filteredExercises = allExercises.filter(e => {
    if (muscleFilter && e.muscleGroup !== muscleFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageShell title="Treinos" rightAction={
      <button onClick={openCreate} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Plus size={20} />
      </button>
    }>
      <div className="space-y-4">
        <AnimatePresence>
          {templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">{t.exercises.length} exercícios</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-destructive">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {t.exercises.slice(0, 3).map((e, j) => {
                  const ex = getExerciseById(e.exerciseId);
                  return ex ? (
                    <div key={j} className="flex items-center gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-secondary-foreground font-body">{ex.name}</span>
                      <span className="text-muted-foreground font-body ml-auto">{e.sets.length}x</span>
                    </div>
                  ) : null;
                })}
                {t.exercises.length > 3 && (
                  <p className="text-xs text-muted-foreground font-body">+{t.exercises.length - 3} mais</p>
                )}
              </div>

              <button
                onClick={() => startWorkout(t)}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Play size={18} fill="currentColor" />
                Iniciar
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {templates.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-card mx-auto flex items-center justify-center">
              <Plus size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-body">Crie sua primeira rotina de treino</p>
            <button onClick={openCreate} className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold">
              Criar Rotina
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
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary font-body"
            />

            <div className="space-y-2">
              {selectedExercises.map((ex, i) => {
                const exercise = getExerciseById(ex.exerciseId);
                return (
                  <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{exercise?.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{ex.sets.length} séries</p>
                    </div>
                    <button onClick={() => removeExercise(i)} className="text-destructive">
                      <Trash2 size={16} />
                    </button>
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
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary font-body text-sm"
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
