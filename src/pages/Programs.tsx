import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bot, ChevronRight, Plus, Play, Clock, Target, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useTemplates } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TrainingProgram {
  id: string;
  name: string;
  weeks: number;
  goal: string;
  level: string;
  daysPerWeek: number;
  templateIds: string[];
  currentWeek: number;
  startedAt?: string;
  status: 'available' | 'active' | 'completed';
}

const presetPrograms: Omit<TrainingProgram, 'id' | 'currentWeek' | 'status'>[] = [
  {
    name: 'Push/Pull/Legs - Hipertrofia',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Intermediário',
    daysPerWeek: 6,
    templateIds: [],
  },
  {
    name: 'Upper/Lower - Força',
    weeks: 6,
    goal: 'Força',
    level: 'Intermediário',
    daysPerWeek: 4,
    templateIds: [],
  },
  {
    name: 'Full Body - Iniciante',
    weeks: 4,
    goal: 'Adaptação',
    level: 'Iniciante',
    daysPerWeek: 3,
    templateIds: [],
  },
  {
    name: 'ABC - Volume',
    weeks: 8,
    goal: 'Hipertrofia',
    level: 'Avançado',
    daysPerWeek: 5,
    templateIds: [],
  },
];

export default function Programs() {
  const navigate = useNavigate();
  const [templates] = useTemplates();

  return (
    <PageShell>
      <div className="pt-14 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Programas de Treino</h1>
            <p className="text-xs text-muted-foreground font-body">Planos estruturados para resultados</p>
          </div>
        </div>

        {/* AI Generator */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/ai-coach')}
          className="w-full bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bot size={22} className="text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm">Gerar Programa com IA</p>
            <p className="text-xs text-muted-foreground font-body">FitAI cria um programa personalizado para você</p>
          </div>
          <ChevronRight size={18} className="text-primary" />
        </motion.button>

        {/* Preset Programs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Programas Populares</h2>
          {presetPrograms.map((program, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{program.name}</h3>
                  <div className="flex gap-2 mt-1.5">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-medium">{program.goal}</span>
                    <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-md text-[10px] font-medium">{program.level}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1"><Clock size={12} /> {program.weeks} semanas</span>
                <span className="flex items-center gap-1"><Target size={12} /> {program.daysPerWeek}x/semana</span>
              </div>
              <button
                onClick={() => navigate('/ai-coach')}
                className="w-full bg-secondary rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-foreground"
              >
                <Bot size={16} className="text-primary" /> Personalizar com IA
              </button>
            </motion.div>
          ))}
        </div>

        {/* Your Templates */}
        {templates.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Suas Rotinas</h2>
            <p className="text-xs text-muted-foreground font-body">Use suas rotinas existentes como base para programas</p>
            {templates.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                className="bg-card rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{t.exercises.length} exercícios</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
