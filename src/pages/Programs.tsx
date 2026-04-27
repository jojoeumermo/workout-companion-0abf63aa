import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Play, Clock, Target, Trash2, ArrowLeft, Calendar, Dumbbell, X, CheckCircle, Copy, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useTemplates, useActiveWorkout } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutTemplate, ActiveWorkout, WorkoutExercise } from '@/types/workout';
import { getAllExercises } from '@/data/exercises';
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

interface PresetWorkout {
  name: string;
  exercises: string[];           // exercise names (looked up at runtime)
  notes?: string;
}

interface PresetProgram {
  id: string;
  name: string;
  weeks: number;
  goal: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  daysPerWeek: number;
  description: string;
  workouts: PresetWorkout[];
  highlights: string[];
}

const PRESET_PROGRAMS: PresetProgram[] = [
  {
    id: 'ppl-classic',
    name: 'PPL — Push / Pull / Legs',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 6,
    description: 'Divisão clássica em três tipos de treino: empurrar (peito, ombros, tríceps), puxar (costas, bíceps) e pernas. Roda duas vezes na semana com 1 dia de descanso.',
    highlights: ['6 treinos por semana', 'Volume alto e equilibrado', 'Roda Push/Pull/Legs 2x'],
    workouts: [
      { name: 'Push (Peito, Ombros, Tríceps)', exercises: ['Supino Reto com Barra', 'Supino Inclinado com Halteres', 'Desenvolvimento com Halteres', 'Elevação Lateral', 'Tríceps Corda', 'Tríceps Francês'] },
      { name: 'Pull (Costas e Bíceps)', exercises: ['Barra Fixa (Pull-up)', 'Remada Curvada com Barra', 'Puxada Frontal', 'Face Pull', 'Rosca Direta com Barra', 'Rosca Martelo'] },
      { name: 'Legs (Pernas e Glúteos)', exercises: ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Cadeira Flexora', 'Stiff', 'Panturrilha em Pé'] },
    ],
  },
  {
    id: 'arnold-split',
    name: 'Arnold Split',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Avançado',
    daysPerWeek: 6,
    description: 'Divisão usada por Arnold: Peito+Costas, Ombros+Braços, Pernas — cada par treinado duas vezes na semana. Foco em volume e variedade de ângulos.',
    highlights: ['6 treinos / 3 dias diferentes', 'Combina antagonistas (peito+costas)', 'Volume alto por grupo'],
    workouts: [
      { name: 'Peito + Costas', exercises: ['Supino Reto com Barra', 'Crucifixo com Halteres', 'Barra Fixa (Pull-up)', 'Remada Curvada com Barra', 'Pullover com Halter', 'Crossover'] },
      { name: 'Ombros + Braços', exercises: ['Desenvolvimento com Barra', 'Elevação Lateral', 'Crucifixo Inverso', 'Rosca Direta com Barra', 'Rosca Concentrada', 'Tríceps Testa', 'Tríceps Corda'] },
      { name: 'Pernas', exercises: ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Cadeira Flexora', 'Stiff', 'Panturrilha Sentado', 'Panturrilha em Pé'] },
    ],
  },
  {
    id: 'heavy-duty',
    name: 'Heavy Duty (HIT)',
    weeks: 6,
    goal: 'Hipertrofia',
    level: 'Avançado',
    daysPerWeek: 3,
    description: 'Estilo Mike Mentzer: pouquíssimas séries, intensidade máxima e descanso longo. Uma série até a falha por exercício, treinando 3x por semana.',
    highlights: ['1 série até a falha por exercício', 'Recuperação extra entre treinos', 'Foco em intensidade total'],
    workouts: [
      { name: 'Treino A (Peito, Costas, Ombros)', exercises: ['Supino Inclinado com Halteres', 'Crucifixo na Máquina', 'Puxada Frontal', 'Remada na Máquina', 'Desenvolvimento na Máquina'] },
      { name: 'Treino B (Pernas)', exercises: ['Leg Press 45°', 'Cadeira Extensora', 'Cadeira Flexora', 'Panturrilha em Pé'] },
      { name: 'Treino C (Braços)', exercises: ['Rosca Scott', 'Rosca Concentrada', 'Tríceps Pulley', 'Tríceps Francês'] },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body — Iniciante',
    weeks: 4,
    goal: 'Adaptação',
    level: 'Iniciante',
    daysPerWeek: 3,
    description: 'Treino de corpo inteiro 3x na semana. Ideal para começar: aprende padrões de movimento, cria base de força e estabelece o hábito.',
    highlights: ['3 treinos / corpo todo', 'Movimentos compostos básicos', 'Recuperação entre os dias'],
    workouts: [
      { name: 'Full Body A', exercises: ['Agachamento Livre', 'Supino Reto com Halteres', 'Remada Unilateral com Halter', 'Desenvolvimento com Halteres', 'Prancha'] },
      { name: 'Full Body B', exercises: ['Leg Press', 'Puxada Frontal', 'Supino Inclinado com Halteres', 'Elevação Lateral', 'Rosca Alternada com Halteres', 'Crunch'] },
      { name: 'Full Body C', exercises: ['Stiff', 'Remada Baixa (Sentado)', 'Flexão de Braço', 'Cadeira Extensora', 'Tríceps Corda', 'Panturrilha em Pé'] },
    ],
  },
  {
    id: 'abc',
    name: 'ABC — Volume',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 5,
    description: 'Divisão em 3 dias (A=Peito+Tríceps, B=Costas+Bíceps, C=Pernas+Ombros). 5 dias por semana com volume alto por músculo.',
    highlights: ['3 treinos diferentes', 'Trabalha agonistas/sinergistas', 'Bom para hipertrofia geral'],
    workouts: [
      { name: 'A — Peito + Tríceps', exercises: ['Supino Reto com Barra', 'Supino Inclinado com Halteres', 'Crucifixo com Halteres', 'Crossover', 'Tríceps Testa', 'Tríceps Corda'] },
      { name: 'B — Costas + Bíceps', exercises: ['Barra Fixa (Pull-up)', 'Remada Curvada com Barra', 'Puxada Aberta', 'Remada Baixa (Sentado)', 'Rosca Direta com Barra', 'Rosca Scott'] },
      { name: 'C — Pernas + Ombros', exercises: ['Agachamento Livre', 'Leg Press', 'Cadeira Flexora', 'Stiff', 'Desenvolvimento com Barra', 'Elevação Lateral', 'Panturrilha em Pé'] },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower — Força',
    weeks: 6,
    goal: 'Força',
    level: 'Intermediário',
    daysPerWeek: 4,
    description: 'Alterna treinos de parte superior e inferior. 4 dias por semana com foco em movimentos compostos e progressão de carga.',
    highlights: ['4 dias / 2 treinos repetidos', 'Foco em compostos pesados', 'Bom para força e hipertrofia'],
    workouts: [
      { name: 'Upper A', exercises: ['Supino Reto com Barra', 'Remada Curvada com Barra', 'Desenvolvimento com Barra', 'Puxada Frontal', 'Rosca Direta com Barra', 'Tríceps Testa'] },
      { name: 'Lower A', exercises: ['Agachamento Livre', 'Stiff', 'Leg Press', 'Cadeira Flexora', 'Panturrilha em Pé', 'Crunch'] },
      { name: 'Upper B', exercises: ['Supino Inclinado com Halteres', 'Barra Fixa (Pull-up)', 'Desenvolvimento com Halteres', 'Remada Baixa (Sentado)', 'Rosca Martelo', 'Tríceps Corda'] },
      { name: 'Lower B', exercises: ['Levantamento Terra', 'Agachamento Frontal', 'Cadeira Extensora', 'Hip Thrust', 'Panturrilha Sentado', 'Prancha'] },
    ],
  },
  {
    id: 'ppl-6x',
    name: 'PPL 6x — Alto Volume',
    weeks: 10,
    goal: 'Hipertrofia',
    level: 'Avançado',
    daysPerWeek: 6,
    description: 'Versão expandida do PPL com 2 variações de cada treino. Pesado em compostos no início da semana, hipertrofia no final.',
    highlights: ['6 treinos sem repetir', 'Pesado + Hipertrofia', 'Ótimo para platô'],
    workouts: [
      { name: 'Push pesado', exercises: ['Supino Reto com Barra', 'Desenvolvimento com Barra', 'Supino Inclinado com Halteres', 'Tríceps Testa'] },
      { name: 'Pull pesado', exercises: ['Levantamento Terra', 'Barra Fixa (Pull-up)', 'Remada Curvada com Barra', 'Rosca Direta com Barra'] },
      { name: 'Legs pesado', exercises: ['Agachamento Livre', 'Leg Press', 'Stiff', 'Panturrilha em Pé'] },
      { name: 'Push hipertrofia', exercises: ['Supino Inclinado com Halteres', 'Crossover', 'Elevação Lateral', 'Tríceps Corda', 'Tríceps Francês'] },
      { name: 'Pull hipertrofia', exercises: ['Puxada Aberta', 'Remada Baixa (Sentado)', 'Face Pull', 'Rosca Scott', 'Rosca Martelo'] },
      { name: 'Legs hipertrofia', exercises: ['Agachamento Búlgaro', 'Cadeira Extensora', 'Cadeira Flexora', 'Hip Thrust', 'Panturrilha Sentado'] },
    ],
  },
  {
    id: 'hipertrofia-base',
    name: 'Hipertrofia — Iniciante / Intermediário',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 4,
    description: 'Divisão simples em 4 dias para quem está saindo da fase iniciante. Foca volume moderado em todos os grupos com exercícios chave.',
    highlights: ['4 treinos / sem complicação', 'Volume e técnica equilibrados', 'Boa transição para intermediários'],
    workouts: [
      { name: 'Peito + Tríceps', exercises: ['Supino Reto com Barra', 'Supino Inclinado com Halteres', 'Crucifixo com Halteres', 'Tríceps Corda', 'Tríceps Francês'] },
      { name: 'Costas + Bíceps', exercises: ['Puxada Frontal', 'Remada Unilateral com Halter', 'Remada Baixa (Sentado)', 'Rosca Direta com Barra', 'Rosca Alternada com Halteres'] },
      { name: 'Pernas', exercises: ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Stiff', 'Panturrilha em Pé'] },
      { name: 'Ombros + Abdômen', exercises: ['Desenvolvimento com Halteres', 'Elevação Lateral', 'Elevação Frontal', 'Crucifixo Inverso', 'Crunch', 'Prancha'] },
    ],
  },
  {
    id: 'forca-basico',
    name: 'Força — Básico',
    weeks: 6,
    goal: 'Força',
    level: 'Intermediário',
    daysPerWeek: 3,
    description: 'Inspirado em programas de força tipo Starting Strength: foco em agachamento, supino, terra e desenvolvimento. Cargas progressivas semana a semana.',
    highlights: ['3 treinos / semana', 'Compostos básicos', 'Progressão linear de carga'],
    workouts: [
      { name: 'Treino A', exercises: ['Agachamento Livre', 'Supino Reto com Barra', 'Remada Curvada com Barra'] },
      { name: 'Treino B', exercises: ['Agachamento Livre', 'Desenvolvimento com Barra', 'Levantamento Terra'] },
      { name: 'Treino C', exercises: ['Agachamento Livre', 'Supino Inclinado com Barra', 'Barra Fixa (Pull-up)'] },
    ],
  },
  {
    id: 'cutting',
    name: 'Cutting — Definição',
    weeks: 8,
    goal: 'Emagrecimento',
    level: 'Intermediário',
    daysPerWeek: 5,
    description: 'Treino para fase de cutting: mantém estímulo muscular, eleva gasto calórico com circuitos e cardio. Combine com déficit calórico moderado.',
    highlights: ['Volume alto / repetições maiores', 'Cardio integrado', 'Preserva massa magra'],
    workouts: [
      { name: 'Upper Body', exercises: ['Supino Reto com Halteres', 'Remada Unilateral com Halter', 'Desenvolvimento com Halteres', 'Crucifixo com Halteres', 'Rosca Alternada com Halteres', 'Tríceps Corda'] },
      { name: 'Lower Body', exercises: ['Agachamento Livre', 'Afundo (Lunge)', 'Stiff', 'Cadeira Extensora', 'Cadeira Flexora', 'Panturrilha em Pé'] },
      { name: 'Full Body Metabólico', exercises: ['Agachamento Goblet', 'Flexão de Braço', 'Remada Baixa (Sentado)', 'Mountain Climber', 'Burpee', 'Prancha'] },
      { name: 'Costas + Glúteos', exercises: ['Puxada Frontal', 'Remada Curvada com Barra', 'Hip Thrust', 'Coice no Cabo', 'Abdução na Máquina'] },
      { name: 'Cardio HIIT', exercises: ['Corrida na Esteira', 'Bicicleta Ergométrica', 'Burpee', 'Pular Corda', 'Mountain Climber'] },
    ],
  },
  {
    id: 'bulking',
    name: 'Bulking — Massa Muscular',
    weeks: 10,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 5,
    description: 'Programa para fase de bulking: alto volume e cargas pesadas em compostos. Combine com superávit calórico para ganho de massa.',
    highlights: ['5 treinos / volume alto', 'Compostos pesados primeiro', 'Bom para superávit calórico'],
    workouts: [
      { name: 'Peito + Tríceps', exercises: ['Supino Reto com Barra', 'Supino Inclinado com Barra', 'Crucifixo com Halteres', 'Crossover', 'Tríceps Testa', 'Mergulho nas Paralelas'] },
      { name: 'Costas + Bíceps', exercises: ['Levantamento Terra', 'Barra Fixa (Pull-up)', 'Remada Curvada com Barra', 'Puxada Frontal', 'Rosca Direta com Barra', 'Rosca Scott'] },
      { name: 'Pernas', exercises: ['Agachamento Livre', 'Leg Press', 'Stiff', 'Cadeira Extensora', 'Cadeira Flexora', 'Panturrilha em Pé'] },
      { name: 'Ombros + Abdômen', exercises: ['Desenvolvimento com Barra', 'Arnold Press', 'Elevação Lateral', 'Crucifixo Inverso', 'Encolhimento com Halteres', 'Russian Twist'] },
      { name: 'Braços + Acessórios', exercises: ['Rosca Alternada com Halteres', 'Rosca Martelo', 'Tríceps Corda', 'Tríceps Francês', 'Face Pull'] },
    ],
  },
  {
    id: 'home-workout',
    name: 'Treino em Casa',
    weeks: 6,
    goal: 'Resistência',
    level: 'Iniciante',
    daysPerWeek: 4,
    description: 'Sem equipamentos: use o próprio peso corporal. Ótimo para manter forma em casa, viagens ou começar do zero.',
    highlights: ['Sem equipamentos', '4 treinos curtos', 'Pode treinar em qualquer lugar'],
    workouts: [
      { name: 'Empurrar (Peito + Ombros + Tríceps)', exercises: ['Flexão de Braço', 'Flexão Diamante', 'Flexão Inclinada', 'Tríceps Banco', 'Prancha com Elevação de Braço'] },
      { name: 'Pernas + Glúteos', exercises: ['Agachamento Goblet', 'Afundo (Lunge)', 'Glute Bridge', 'Step Up', 'Panturrilha no Step'] },
      { name: 'Core', exercises: ['Prancha', 'Abdominal Bicicleta', 'Mountain Climber', 'Russian Twist', 'Hollow Body Hold'] },
      { name: 'Cardio Funcional', exercises: ['Burpee', 'Jumping Jack', 'Mountain Climber', 'Pular Corda', 'Bear Crawl'] },
    ],
  },
  {
    id: 'dumbbell-only',
    name: 'Treino com Halteres',
    weeks: 6,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 4,
    description: 'Programa completo usando apenas halteres e um banco. Perfeito para academia caseira ou home gym minimalista.',
    highlights: ['Apenas halteres + banco', '4 treinos full upper/lower', 'Trabalha o corpo todo'],
    workouts: [
      { name: 'Upper A — Empurrar', exercises: ['Supino Reto com Halteres', 'Supino Inclinado com Halteres', 'Desenvolvimento com Halteres', 'Elevação Lateral', 'Tríceps Francês'] },
      { name: 'Lower A — Pernas', exercises: ['Agachamento Goblet', 'Afundo (Lunge)', 'Stiff', 'Agachamento Búlgaro', 'Panturrilha Unilateral'] },
      { name: 'Upper B — Puxar', exercises: ['Remada Unilateral com Halter', 'Pullover com Halter', 'Crucifixo Inverso', 'Rosca Alternada com Halteres', 'Rosca Martelo'] },
      { name: 'Lower B — Glúteos + Core', exercises: ['Hip Thrust com Halter', 'Step Up', 'Glute Bridge', 'Russian Twist', 'Prancha'] },
    ],
  },
  {
    id: 'feminino-gluteos',
    name: 'Treino Feminino — Glúteos & Pernas',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 4,
    description: 'Foco em glúteos, posterior e quadríceps. Inclui hip thrust pesado, abduções e exercícios unilaterais para simetria.',
    highlights: ['Foco glúteos + pernas', 'Inclui upper de manutenção', 'Trabalho unilateral'],
    workouts: [
      { name: 'Glúteos pesado', exercises: ['Hip Thrust', 'Agachamento Sumô', 'Coice no Cabo', 'Abdução na Máquina', 'Glute Bridge'] },
      { name: 'Quadríceps + posterior', exercises: ['Agachamento Livre', 'Leg Press 45°', 'Cadeira Extensora', 'Cadeira Flexora', 'Stiff'] },
      { name: 'Glúteos volume', exercises: ['Hip Thrust com Halter', 'Agachamento Búlgaro', 'Elevação Pélvica', 'Abdução com Elástico', 'Adução na Máquina'] },
      { name: 'Upper + Core', exercises: ['Puxada Frontal', 'Desenvolvimento com Halteres', 'Elevação Lateral', 'Rosca Alternada com Halteres', 'Prancha', 'Russian Twist'] },
    ],
  },
  {
    id: 'express-30min',
    name: 'Treino Express 30 min',
    weeks: 4,
    goal: 'Resistência',
    level: 'Iniciante',
    daysPerWeek: 4,
    description: 'Treinos rápidos de até 30 minutos com 4–5 exercícios bem escolhidos. Ideal para rotinas corridas e dias sem tempo.',
    highlights: ['Até 30 min por treino', '4–5 exercícios chave', 'Mantém o ritmo na rotina'],
    workouts: [
      { name: 'Express Empurrar', exercises: ['Supino Reto com Halteres', 'Desenvolvimento com Halteres', 'Tríceps Corda', 'Flexão de Braço'] },
      { name: 'Express Puxar', exercises: ['Puxada Frontal', 'Remada Baixa (Sentado)', 'Rosca Alternada com Halteres', 'Face Pull'] },
      { name: 'Express Pernas', exercises: ['Agachamento Livre', 'Leg Press', 'Stiff', 'Panturrilha em Pé'] },
      { name: 'Express Full Body', exercises: ['Agachamento Goblet', 'Flexão de Braço', 'Remada Unilateral com Halter', 'Prancha', 'Burpee'] },
    ],
  },
];

const LEVEL_COLOR: Record<string, string> = {
  'Iniciante': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Intermediário': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Avançado': 'text-red-400 bg-red-500/10 border-red-500/20',
  'Personalizado': 'text-primary bg-primary/10 border-primary/20',
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

function buildTemplatesFromPreset(preset: PresetProgram): WorkoutTemplate[] {
  const all = getAllExercises();
  const now = Date.now();
  return preset.workouts.map((w, idx) => {
    const exercises: WorkoutExercise[] = w.exercises
      .map(name => all.find(e => e.name === name))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map(e => ({
        exerciseId: e.id,
        restTime: 90,
        sets: Array.from({ length: 3 }, () => ({ targetReps: 10, weight: 0 })),
      }));
    return {
      id: `tmpl-${now}-${idx}`,
      name: `${preset.name} • ${w.name}`,
      exercises,
      createdAt: new Date().toISOString(),
      folder: preset.name,
    };
  });
}

export default function Programs() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useTemplates();
  const [, setActiveWorkout] = useActiveWorkout();
  const { programs, addProgram, removeProgram, activateProgram } = usePrograms();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetProgram | null>(null);
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

  const handleActivatePreset = (preset: PresetProgram, copyRoutines: boolean) => {
    let schedule: { day: number; templateId: string }[] = [];

    if (copyRoutines) {
      const newTemplates = buildTemplatesFromPreset(preset);
      setTemplates(prev => [...prev, ...newTemplates]);
      schedule = newTemplates.map((t, i) => ({ day: i + 1, templateId: t.id }));
    }

    addProgram({
      name: preset.name,
      weeks: preset.weeks,
      goal: preset.goal,
      level: preset.level,
      daysPerWeek: preset.daysPerWeek,
      description: preset.description,
      schedule,
      currentWeek: 1,
      status: 'active',
      startedAt: new Date().toISOString(),
    });
    setSelectedPreset(null);
    haptic('success');
    if (copyRoutines) {
      toast.success(`"${preset.name}" ativado e ${preset.workouts.length} rotinas adicionadas!`);
    } else {
      toast.success(`"${preset.name}" ativado!`);
    }
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
            <h1 className="text-3xl font-black tracking-tight">Programas</h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">Biblioteca de planos prontos</p>
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

        {/* Preset Programs — Library */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight">Biblioteca de Programas</h2>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{PRESET_PROGRAMS.length} planos prontos para usar</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded-md">{PRESET_PROGRAMS.length}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PRESET_PROGRAMS.map((prog, i) => (
              <motion.button
                key={prog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.25) }}
                onClick={() => { haptic('light'); setSelectedPreset(prog); }}
                className="card-premium rounded-2xl p-4 flex flex-col gap-3 text-left active:scale-[0.97] transition-transform hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-primary" />
                  </div>
                  <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-md border ${LEVEL_COLOR[prog.level] || 'bg-secondary text-muted-foreground border-border/30'}`}>
                    {prog.level}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm leading-tight tracking-tight line-clamp-2">{prog.name}</p>
                  <p className="text-[11px] text-muted-foreground font-body mt-1 truncate">{prog.goal}</p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                    <span className="flex items-center gap-1"><Calendar size={10} />{prog.daysPerWeek}x</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{prog.weeks}sem</span>
                  </div>
                  <span className="text-[10px] font-black text-primary flex items-center gap-0.5">
                    Usar <ChevronRight size={11} />
                  </span>
                </div>
              </motion.button>
            ))}
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
                    <p className="text-xl font-black text-primary">{selectedPreset.workouts.length}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Treinos</p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-primary">Destaques</p>
                  <ul className="space-y-1">
                    {selectedPreset.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-muted-foreground font-body flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Workouts breakdown */}
                <div className="space-y-3">
                  <p className="text-sm font-bold">Treinos sugeridos</p>
                  {selectedPreset.workouts.map((w, i) => (
                    <div key={i} className="bg-secondary/40 rounded-xl p-4 space-y-2 border border-border/30">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-sm font-bold leading-tight">{w.name}</p>
                      </div>
                      <ul className="space-y-1 pl-8">
                        {w.exercises.map((ex, j) => (
                          <li key={j} className="text-xs text-muted-foreground font-body flex items-start gap-1.5">
                            <span className="text-primary/60">→</span>
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    onClick={() => handleActivatePreset(selectedPreset, true)}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-base shadow-glow"
                  >
                    <Play size={18} fill="currentColor" /> Usar programa
                  </button>
                  <button
                    onClick={() => handleActivatePreset(selectedPreset, false)}
                    className="w-full bg-secondary rounded-xl py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm"
                  >
                    <CheckCircle size={18} className="text-primary" /> Ativar sem copiar rotinas
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
