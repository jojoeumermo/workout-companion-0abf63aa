import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bot, ChevronRight, Plus, Play, Clock, Target, Trash2, ArrowLeft, Calendar, Dumbbell, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useTemplates, useActiveWorkout } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutTemplate, ActiveWorkout } from '@/types/workout';
import { haptic } from '@/lib/haptic';
import { toast } from 'sonner';

interface TrainingProgram {
  id: string;
  name: string;
  weeks: number;
  goal: string;
  level: string;
  daysPerWeek: number;
  description?: string;
  schedule: { day: number; templateId: string }[];
  currentWeek: number;
  startedAt?: string;
  status: 'available' | 'active' | 'completed';
}

const presetPrograms = [
  {
    name: 'Push/Pull/Legs - Hipertrofia',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 6,
    description: 'Divida treinos em empurrar (peito, ombros, tríceps), puxar (costas, bíceps) e pernas. 6 dias por semana com 1 dia de descanso. Excelente para volume e definição muscular.',
  },
  {
    name: 'Upper/Lower - Força',
    weeks: 6,
    goal: 'Força',
    level: 'Intermediário',
    daysPerWeek: 4,
    description: 'Alterne entre treinos de parte superior e inferior. 4 dias por semana com foco em movimentos compostos e progressão de carga. Ideal para ganhos de força.',
  },
  {
    name: 'Full Body - Iniciante',
    weeks: 4,
    goal: 'Adaptação',
    level: 'Iniciante',
    daysPerWeek: 3,
    description: 'Treino de corpo inteiro 3 vezes por semana. Ideal para começar: ensina padrões de movimento, cria base de força e desenvolve hábito de treinar.',
  },
  {
    name: 'ABC - Volume',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Avançado',
    daysPerWeek: 5,
    description: 'Divisão em 3 dias (A=Peito+Tríceps, B=Costas+Bíceps, C=Pernas+Ombros) com alto volume. 5-6 dias por semana para máxima hipertrofia.',
  },
  {
    name: 'ABCDE - Avançado',
    weeks: 10,
    goal: 'Hipertrofia',
    level: 'Avançado',
    daysPerWeek: 5,
    description: 'Um grupo muscular por dia durante 5 dias consecutivos. Máximo foco e volume por músculo. Para atletas experientes com boa recuperação.',
  },
];

const LEVEL_COLOR: Record<string, string> = {
  'Iniciante': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Intermediário': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Avançado': 'text-red-400 bg-red-500/10 border-red-500/20',
};

function usePrograms() {
  const [programs, setPrograms] = useState<TrainingProgram[]>(() => {
    try { return JSON.parse(localStorage.getItem('training-programs') || '[]'); } catch { return []; }
  });

  const save = (progs: TrainingProgram[]) => {
    setPrograms(progs);
    localStorage.setItem('training-programs', JSON.stringify(progs));
  };

  const addProgram = (program: Omit<TrainingProgram, 'id'>) => {
    const p = { ...program, id: `prog-${Date.now()}` };
    save([...programs, p]);
    return p;
  };

  const removeProgram = (id: string) => save(programs.filter(p => p.id !== id));

  const activateProgram = (id: string) => {
    save(programs.map(p => p.id === id
      ? { ...p, status: 'active' as const, startedAt: new Date().toISOString(), currentWeek: 1 }
      : { ...p, status: p.status === 'active' ? 'available' as const : p.status }
    ));
  };

  return { programs, addProgram, removeProgram, activateProgram };
}

export default function Programs() {
  const navigate = useNavigate();
  const [templates] = useTemplates();
  const [, setActiveWorkout] = useActiveWorkout();
  const { programs, addProgram, removeProgram, activateProgram } = usePrograms();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof presetPrograms[0] | null>(null);
  const [newProgram, setNewProgram] = useState({
    name: '',
    weeks: 4,
    goal: 'Hipertrofia',
    daysPerWeek: 4,
  });
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const activeProgram = programs.find(p => p.status === 'active');

  const handleCreateProgram = () => {
    if (!newProgram.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    addProgram({
      name: newProgram.name.trim(),
      weeks: newProgram.weeks,
      goal: newProgram.goal,
      level: 'Personalizado',
      daysPerWeek: newProgram.daysPerWeek,
      schedule: selectedTemplates.map((tid, i) => ({ day: i + 1, templateId: tid })),
      currentWeek: 0,
      status: 'available',
    });
    setShowCreate(false);
    setNewProgram({ name: '', weeks: 4, goal: 'Hipertrofia', daysPerWeek: 4 });
    setSelectedTemplates([]);
    haptic('success');
    toast.success('Programa criado!');
  };

  const handleActivatePreset = (preset: typeof presetPrograms[0]) => {
    addProgram({
      name: preset.name,
      weeks: preset.weeks,
      goal: preset.goal,
      level: preset.level,
      daysPerWeek: preset.daysPerWeek,
      description: preset.description,
      schedule: [],
      currentWeek: 1,
      status: 'active',
      startedAt: new Date().toISOString(),
    });
    setSelectedPreset(null);
    haptic('success');
    toast.success(`"${preset.name}" ativado!`);
  };

  const startTemplateWorkout = (template: WorkoutTemplate) => {
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
    haptic('medium');
    navigate('/treino-ativo');
  };

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-card border border-border/50 flex items-center justify-center active:scale-95 transition-transform hover:border-primary/30">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight">Programas de Treino</h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">Planos estruturados para resultados</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary active:scale-95 transition-transform hover:bg-primary/25">
            <Plus size={22} />
          </button>
        </div>

        {/* Active program */}
        {activeProgram && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium border-primary/30 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md inline-block mb-2">Programa Ativo</p>
                <h3 className="font-black text-2xl tracking-tight leading-none">{activeProgram.name}</h3>
                {activeProgram.description && (
                  <p className="text-xs text-muted-foreground font-body mt-2 leading-relaxed">{activeProgram.description}</p>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xl font-black text-primary leading-none">Semana {activeProgram.currentWeek}</p>
                <p className="text-xs text-muted-foreground font-body mt-1">de {activeProgram.weeks}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground font-body">
              <span className="flex items-center gap-1.5"><Target size={16} /> {activeProgram.goal}</span>
              <span className="flex items-center gap-1.5"><Calendar size={16} /> {activeProgram.daysPerWeek}x/sem</span>
              <span className="flex items-center gap-1.5"><Clock size={16} /> {activeProgram.weeks} semanas</span>
            </div>
            {activeProgram.schedule.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-bold text-muted-foreground">Treinos do programa:</p>
                {activeProgram.schedule.map((s, i) => {
                  const tmpl = templates.find(t => t.id === s.templateId);
                  if (!tmpl) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => startTemplateWorkout(tmpl)}
                      className="w-full bg-secondary/80 border border-border/50 rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Dumbbell size={16} className="text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold">{tmpl.name}</p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">{tmpl.exercises.length} exercícios</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Play size={14} className="text-primary" fill="currentColor" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {activeProgram.schedule.length === 0 && (
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold">Vincular rotinas ao programa</p>
                <p className="text-xs text-muted-foreground font-body">Crie rotinas na aba Treinos e edite o programa para vinculá-las aqui.</p>
                <button
                  onClick={() => navigate('/treinos')}
                  className="text-xs text-primary font-bold flex items-center gap-1 mt-1"
                >
                  Ir para Treinos <ChevronRight size={12} />
                </button>
              </div>
            )}
            <button
              onClick={() => { removeProgram(activeProgram.id); haptic('light'); toast.success('Programa encerrado'); }}
              className="w-full border border-destructive/30 text-destructive rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-destructive/5 transition-all"
            >
              <X size={16} /> Encerrar Programa
            </button>
          </motion.div>
        )}

        {/* AI Generator */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          onClick={() => navigate('/ai-coach')}
          className="w-full card-premium animate-pulse-glow rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform group"
        >
          <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <Bot size={24} className="text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="font-black text-lg">Gerar Programa com IA</p>
            <p className="text-sm text-muted-foreground font-body mt-0.5">FitAI cria um programa personalizado para você</p>
          </div>
          <ChevronRight size={20} className="text-primary group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* User programs */}
        {programs.filter(p => p.status !== 'active').length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">Seus Programas</h2>
            {programs.filter(p => p.status !== 'active').map((program, i) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card-premium rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold">{program.name}</h3>
                    {program.description && (
                      <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed line-clamp-2">{program.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold tracking-wider uppercase">{program.goal}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${LEVEL_COLOR[program.level] || 'text-muted-foreground bg-secondary border-border/30'}`}>{program.level}</span>
                    </div>
                  </div>
                  <button onClick={() => { removeProgram(program.id); haptic('light'); }} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-destructive active:scale-95 transition-transform hover:bg-destructive/10 shrink-0 ml-3">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground font-body">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {program.weeks} semanas</span>
                  <span className="flex items-center gap-1.5"><Target size={14} /> {program.daysPerWeek}x/semana</span>
                </div>
                <button
                  onClick={() => { activateProgram(program.id); haptic('success'); toast.success('Programa ativado!'); }}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Play size={18} fill="currentColor" /> Ativar Programa
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preset Programs */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Programas Populares</h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">Toque para ver detalhes e ativar</p>
          </div>

          <div className="-mx-5 sm:-mx-6 px-5 sm:px-6">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
              {presetPrograms.map((prog, i) => (
                <div
                  key={i}
                  className="hero-section shrink-0 rounded-2xl overflow-hidden card-interactive"
                  style={{ width: '280px', height: '160px', scrollSnapAlign: 'start' }}
                  onClick={() => setSelectedPreset(prog)}
                  role="button"
                >
                  <img src="/images/hero-programs.png" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" style={{ filter: 'brightness(0.45)' }} />
                  <div className="hero-img-overlay" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full backdrop-blur-sm">{prog.goal}</span>
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full backdrop-blur-sm border ${
                        prog.level === 'Iniciante' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        prog.level === 'Intermediário' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>{prog.level}</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-lg leading-tight mb-1.5">{prog.name}</p>
                      <div className="flex items-center gap-3 text-white/70 font-body text-xs font-medium">
                        <span className="flex items-center gap-1"><Clock size={12} /> {prog.weeks} sem</span>
                        <span className="flex items-center gap-1"><Target size={12} /> {prog.daysPerWeek}x/sem</span>
                        <span className="text-white/50">Toque para detalhes →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Your Templates */}
        {templates.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Suas Rotinas</h2>
              <p className="text-sm text-muted-foreground font-body mt-0.5">Rotinas existentes para organizar em programas</p>
            </div>
            {templates.slice(0, 5).map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                onClick={() => startTemplateWorkout(t)}
                className="w-full card-premium rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform hover:border-primary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Dumbbell size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base">{t.name}</p>
                    <p className="text-sm text-muted-foreground font-body mt-0.5">{t.exercises.length} exercícios</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Play size={14} className="text-primary" fill="currentColor" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Preset Program Detail Dialog */}
      <Dialog open={!!selectedPreset} onOpenChange={v => !v && setSelectedPreset(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          {selectedPreset && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black leading-tight pr-8">{selectedPreset.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-2">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold tracking-wider uppercase">{selectedPreset.goal}</span>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase border ${LEVEL_COLOR[selectedPreset.level] || 'bg-secondary text-muted-foreground border-border/30'}`}>{selectedPreset.level}</span>
                </div>

                <p className="text-sm text-muted-foreground font-body leading-relaxed">{selectedPreset.description}</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                    <p className="text-xl font-black text-primary">{selectedPreset.weeks}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Semanas</p>
                  </div>
                  <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                    <p className="text-xl font-black text-primary">{selectedPreset.daysPerWeek}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Dias/sem</p>
                  </div>
                  <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                    <p className="text-xl font-black text-primary">{selectedPreset.weeks * selectedPreset.daysPerWeek}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Treinos</p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-bold text-primary">Como funciona</p>
                  <p className="text-xs text-muted-foreground font-body leading-relaxed">
                    O programa será adicionado à sua lista e marcado como ativo. Você pode vincular suas rotinas existentes ou gerar rotinas específicas com a IA.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    onClick={() => handleActivatePreset(selectedPreset)}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-base shadow-glow"
                  >
                    <CheckCircle size={20} /> Ativar Este Programa
                  </button>
                  <button
                    onClick={() => { setSelectedPreset(null); navigate('/ai-coach'); }}
                    className="w-full bg-secondary rounded-xl py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm text-muted-foreground"
                  >
                    <Bot size={18} className="text-primary" /> Gerar Rotinas com IA
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create program dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Nome do programa</label>
              <input type="text" placeholder="Ex: Meu programa de força" value={newProgram.name} onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Semanas</label>
                <input type="number" inputMode="numeric" value={newProgram.weeks} onChange={e => setNewProgram(p => ({ ...p, weeks: parseInt(e.target.value) || 1 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Dias/semana</label>
                <input type="number" inputMode="numeric" value={newProgram.daysPerWeek} onChange={e => setNewProgram(p => ({ ...p, daysPerWeek: parseInt(e.target.value) || 1 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Objetivo</label>
              <div className="flex flex-wrap gap-1.5">
                {['Hipertrofia', 'Força', 'Resistência', 'Emagrecimento', 'Saúde'].map(g => (
                  <button key={g} onClick={() => setNewProgram(p => ({ ...p, goal: g }))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${newProgram.goal === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{g}</button>
                ))}
              </div>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-body">Vincular rotinas (opcional)</label>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplates(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between ${selectedTemplates.includes(t.id) ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'}`}
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground font-body">{t.exercises.length} ex.</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleCreateProgram} disabled={!newProgram.name.trim()} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50">
              Criar Programa
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
