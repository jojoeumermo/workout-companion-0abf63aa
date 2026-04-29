import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ChevronLeft, ChevronRight, Trash2, UtensilsCrossed, Target, Droplets, Plus, Minus, Settings2, GlassWater, Timer, StopCircle, History, ChevronDown, ChevronUp, TrendingUp, Sparkles, Pill } from 'lucide-react';
import SwipeableRow from '@/components/SwipeableRow';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useMeals, useNutritionGoals, useWaterLog, useWaterGoal, useFasting, useMicroGoals } from '@/hooks/useStorage';
import { localDateKey, parseLocalDate, addDaysKey } from '@/lib/dateUtils';
import { MICRO_LIMITS, MicroGoals, MICRO_DEFS, DEFAULT_MICRO_GOALS, MicroKey } from '@/types/nutrition';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptic';

const MEAL_TYPES = ['cafe', 'almoco', 'jantar', 'lanche', 'outro'] as const;
const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: 'Café da Manhã', almoco: 'Almoço', jantar: 'Jantar', lanche: 'Lanche', outro: 'Outros',
};
const MEAL_TYPE_ICONS: Record<string, string> = {
  cafe: '☀️', almoco: '🍽️', jantar: '🌙', lanche: '🍎', outro: '📋',
};

const WATER_PRESETS = [150, 200, 300, 500];
const FASTING_GOALS = [12, 14, 16, 18, 24];
type Tab = 'Resumo' | 'Refeições' | 'Macros' | 'Jejum';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Semi-circle SVG progress indicator
function SemiCircleMeter({
  consumed, goal, remaining,
}: { consumed: number; goal: number; remaining: number }) {
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const over = consumed > goal;

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg viewBox="0 0 220 120" className="w-full">
        {/* Track */}
        <path
          d="M 18,110 A 92,92 0 0 1 202,110"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Progress (only render when there's actual progress) */}
        {pct > 0 && (
          <path
            d="M 18,110 A 92,92 0 0 1 202,110"
            fill="none"
            stroke={over ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - pct}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        )}
      </svg>
      {/* Stats overlaid */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 gap-0.5">
        <div className={`text-5xl font-black leading-none tracking-tighter ${over ? 'text-destructive' : 'text-foreground'}`}>
          {Math.round(Math.abs(remaining))}
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {over ? 'kcal acima' : 'kcal restantes'}
        </div>
      </div>
    </div>
  );
}

// Donut chart for macros
function DonutChart({
  segments,
}: { segments: { value: number; color: string; label: string; pct: number }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" />
      </svg>
    );
  }

  const r = 48;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
      {segments.map((seg, i) => {
        const segLen = (seg.value / total) * circ;
        const dasharray = `${segLen} ${circ}`;
        const dashoffset = -offset;
        offset += segLen;
        return (
          <circle
            key={i}
            cx="60" cy="60" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

// Live fasting timer
function useFastingElapsed(startedAt: string | null): number {
  const [minutes, setMinutes] = useState(0);
  useEffect(() => {
    if (!startedAt) { setMinutes(0); return; }
    const update = () => setMinutes(Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [startedAt]);
  return minutes;
}

export default function Nutrition() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { meals, deleteMeal, addMeal } = useMeals();
  const [goals, setGoals] = useNutritionGoals();
  const { getTodayWater, addWater, getWaterForDate } = useWaterLog();
  const [waterGoal, setWaterGoal] = useWaterGoal();
  const { data: fastingData, start: startFast, stop: stopFast, deleteFasting } = useFasting();
  const [microGoals, setMicroGoals] = useMicroGoals();
  const [showMicroGoals, setShowMicroGoals] = useState(false);
  const [tempMicroGoals, setTempMicroGoals] = useState<MicroGoals>(microGoals);
  const [showAddMicro, setShowAddMicro] = useState(false);
  const [microEntry, setMicroEntry] = useState<{ key: MicroKey; amount: string; label: string }>({ key: 'vitaminC', amount: '', label: '' });

  const [activeTab, setActiveTab] = useState<Tab>('Resumo');
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [showGoals, setShowGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState(goals);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showWaterSettings, setShowWaterSettings] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState(waterGoal);
  const [customWaterMl, setCustomWaterMl] = useState('');
  const [macroMode, setMacroMode] = useState<'grams' | 'percent'>('grams');
  const [expandedMealTypes, setExpandedMealTypes] = useState<Set<string>>(new Set(['cafe', 'almoco', 'jantar', 'lanche']));
  const [showFastingHistory, setShowFastingHistory] = useState(false);
  const [showConfirmStopFast, setShowConfirmStopFast] = useState(false);
  const [fastingGoalHours, setFastingGoalHours] = useState(16);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isToday = selectedDate === localDateKey();
  const todayWater = isToday ? getTodayWater() : getWaterForDate(selectedDate);
  const fastingElapsedMinutes = useFastingElapsed(fastingData.active?.startedAt ?? null);

  const dayMeals = useMemo(() =>
    meals.filter(m => m.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [meals, selectedDate]
  );

  const dayTotals = useMemo(() => ({
    calories: dayMeals.reduce((s, m) => s + m.totals.calories, 0),
    protein: dayMeals.reduce((s, m) => s + m.totals.protein, 0),
    carbs: dayMeals.reduce((s, m) => s + m.totals.carbs, 0),
    fat: dayMeals.reduce((s, m) => s + m.totals.fat, 0),
  }), [dayMeals]);

  const dayMicros = useMemo(() => {
    const totals = {} as Record<MicroKey, number>;
    MICRO_DEFS.forEach(d => {
      totals[d.key] = dayMeals.reduce((s, m) => s + ((m.totals as any)[d.key] || 0), 0);
    });
    return totals;
  }, [dayMeals]);

  const mealsByType = useMemo(() => {
    const map: Record<string, typeof dayMeals> = {};
    MEAL_TYPES.forEach(t => { map[t] = []; });
    dayMeals.forEach(m => {
      const key = MEAL_TYPES.includes(m.type as any) ? m.type : 'outro';
      map[key] = [...(map[key] || []), m];
    });
    return map;
  }, [dayMeals]);

  const calorieBalance = goals.calories - dayTotals.calories;

  const changeDate = (days: number) => {
    setSelectedDate(addDaysKey(selectedDate, days));
  };

  const dateLabel = isToday
    ? 'Hoje'
    : parseLocalDate(selectedDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const macroBar = (current: number, goal: number, color: string) => {
    const pct = Math.min((current / Math.max(goal, 1)) * 100, 100);
    const over = current > goal;
    return (
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${over ? 'bg-destructive' : color}`}
        />
      </div>
    );
  };

  const handleDeleteMeal = (id: string) => {
    deleteMeal(id);
    setConfirmDelete(null);
    toast({ title: 'Refeição removida' });
  };

  const safeWaterGoal = waterGoal > 0 ? waterGoal : 1;
  const waterPct = Math.min((todayWater / safeWaterGoal) * 100, 100);
  const waterGlasses = Math.round(todayWater / 250);

  const addCustomWater = () => {
    const ml = parseInt(customWaterMl);
    if (ml > 0 && ml <= 5000) { addWater(ml); haptic('light'); setCustomWaterMl(''); }
  };

  const calcMacroPercent = (grams: number, calPerGram: number) => {
    if (tempGoals.calories <= 0) return 0;
    return Math.round((grams * calPerGram / tempGoals.calories) * 100);
  };

  const setMacroFromPercent = (field: 'protein' | 'carbs' | 'fat', percent: number) => {
    const calPerGram = field === 'fat' ? 9 : 4;
    setTempGoals(prev => ({ ...prev, [field]: Math.round((percent / 100) * tempGoals.calories / calPerGram) }));
  };

  const toggleMealType = (type: string) => {
    setExpandedMealTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const navigateToAddMeal = (type?: string) => {
    navigate('/nutricao/registrar', { state: { presetType: type } });
  };

  // Macro donut segments
  const totalMacroKcal = dayTotals.protein * 4 + dayTotals.carbs * 4 + dayTotals.fat * 9;
  const macroSegments = [
    { label: 'Proteína', value: dayTotals.protein * 4, color: 'hsl(var(--macro-protein))', pct: totalMacroKcal > 0 ? Math.round((dayTotals.protein * 4 / totalMacroKcal) * 100) : 0 },
    { label: 'Carbos', value: dayTotals.carbs * 4, color: 'hsl(var(--macro-carbs))', pct: totalMacroKcal > 0 ? Math.round((dayTotals.carbs * 4 / totalMacroKcal) * 100) : 0 },
    { label: 'Gordura', value: dayTotals.fat * 9, color: 'hsl(var(--macro-fat))', pct: totalMacroKcal > 0 ? Math.round((dayTotals.fat * 9 / totalMacroKcal) * 100) : 0 },
  ];

  // Fasting progress
  const fastingGoalMinutes = fastingGoalHours * 60;
  const fastingPct = Math.min(fastingElapsedMinutes / Math.max(fastingGoalMinutes, 1), 1);
  const fastingGoalReached = fastingElapsedMinutes >= fastingGoalMinutes;

  return (
    <PageShell title="Nutrição">
      <div className="max-w-lg mx-auto pt-4 pb-4 space-y-4">

        {/* Date selector */}
        <div className="flex items-center justify-between card-premium p-3 rounded-2xl">
          <button onClick={() => changeDate(-1)} className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <span className="font-black text-lg capitalize tracking-tight">{dateLabel}</span>
          <button onClick={() => changeDate(1)} disabled={isToday} className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex bg-secondary/50 rounded-2xl p-1 gap-1">
          {(['Resumo', 'Refeições', 'Macros', 'Jejum'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── RESUMO TAB ─── */}
        {activeTab === 'Resumo' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Semi-circle card */}
            <div className="card-premium rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-xl tracking-tight">Resumo do Dia</h2>
                <button onClick={() => { setTempGoals(goals); setShowGoals(true); }} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary active:scale-95">
                  <Target size={18} />
                </button>
              </div>
              <SemiCircleMeter consumed={dayTotals.calories} goal={goals.calories} remaining={calorieBalance} />
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Meta', value: goals.calories, unit: 'kcal', muted: true },
                  { label: 'Consumido', value: Math.round(dayTotals.calories), unit: 'kcal', muted: true },
                  { label: 'Restante', value: Math.round(Math.abs(calorieBalance)), unit: calorieBalance < 0 ? 'acima' : 'kcal', muted: false },
                ].map(item => (
                  <div key={item.label} className="text-center bg-secondary/40 rounded-xl py-3 px-2">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`text-base font-black leading-none ${!item.muted && calorieBalance < -100 ? 'text-destructive' : !item.muted ? 'text-primary' : ''}`}>
                      {item.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty state nudge — Resumo tab */}
            {dayMeals.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-4"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <UtensilsCrossed size={20} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-tight">Nenhuma refeição hoje</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Registre o que comeu para acompanhar seus macros</p>
                </div>
                <button
                  onClick={() => navigateToAddMeal()}
                  className="shrink-0 bg-primary text-primary-foreground rounded-xl px-3 py-2 text-xs font-black active:scale-95 transition-transform"
                >
                  Adicionar
                </button>
              </motion.div>
            )}

            {/* Macros mini summary */}
            <div className="card-premium rounded-2xl p-5 space-y-4">
              <h3 className="font-black text-base tracking-tight">Macros</h3>
              <div className="space-y-3">
                {[
                  { label: 'Proteína', current: Math.round(dayTotals.protein), goal: goals.protein, color: 'bg-macro-protein', accent: 'text-macro-protein' },
                  { label: 'Carboidratos', current: Math.round(dayTotals.carbs), goal: goals.carbs, color: 'bg-macro-carbs', accent: 'text-macro-carbs' },
                  { label: 'Gordura', current: Math.round(dayTotals.fat), goal: goals.fat, color: 'bg-macro-fat', accent: 'text-macro-fat' },
                ].map(m => (
                  <div key={m.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{m.label}</span>
                      <span className="text-xs font-black">
                        <span className={m.accent}>{m.current}g</span>
                        <span className="text-muted-foreground font-medium"> / {m.goal}g</span>
                      </span>
                    </div>
                    {macroBar(m.current, m.goal, m.color)}
                  </div>
                ))}
              </div>
            </div>

            {/* Water card */}
            {isToday && (
              <div className="card-premium rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Droplets size={20} className="text-blue-400" />
                    </div>
                    <h3 className="font-black text-base tracking-tight">Água</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-400">{(todayWater / 1000).toFixed(2).replace('.', ',')}L</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">/ {(waterGoal / 1000).toFixed(1).replace('.', ',')}L</span>
                    </div>
                    <button onClick={() => { setTempWaterGoal(waterGoal); setShowWaterSettings(true); }} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-90">
                      <Settings2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${waterPct}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-blue-400 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>{waterGlasses} copos</span>
                    <span>{Math.max(0, waterGoal - todayWater)}ml restantes</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {WATER_PRESETS.map(ml => (
                    <button key={ml} onClick={() => { addWater(ml); haptic('light'); }} className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl py-2.5 text-xs font-black active:scale-95">
                      +{ml < 1000 ? `${ml}ml` : `${ml / 1000}L`}
                    </button>
                  ))}
                  <button onClick={() => { addWater(-150); haptic('light'); }} className="w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95">
                    <Minus size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number" inputMode="numeric" placeholder="Personalizado (ml)"
                    value={customWaterMl} onChange={e => setCustomWaterMl(e.target.value)}
                    className="flex-1 min-w-0 bg-secondary rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400/40 placeholder:text-muted-foreground/50"
                  />
                  <button onClick={addCustomWater} disabled={!customWaterMl || parseInt(customWaterMl) <= 0} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl px-4 py-3 disabled:opacity-40 active:scale-95 flex items-center justify-center shrink-0">
                    <GlassWater size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Quick register */}
            <button
              onClick={() => navigateToAddMeal()}
              className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-2.5 font-black text-sm active:scale-[0.97] transition-transform shadow-glow"
            >
              <Utensils size={18} />
              Registrar Refeição
            </button>
          </motion.div>
        )}

        {/* ─── REFEIÇÕES TAB ─── */}
        {activeTab === 'Refeições' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button
              onClick={() => navigateToAddMeal()}
              className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-2.5 font-black text-sm active:scale-[0.97] transition-transform shadow-glow"
            >
              <Utensils size={18} />
              Registrar Refeição
            </button>

            {/* Empty state — no meals today */}
            {dayMeals.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center py-8 space-y-3"
              >
                <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto">
                  <UtensilsCrossed size={28} className="text-muted-foreground/30" />
                </div>
                <div>
                  <p className="font-bold text-sm text-muted-foreground">Nenhuma refeição registrada</p>
                  <p className="text-xs text-muted-foreground/60 font-body mt-1">
                    {isToday ? 'Toque em "Registrar Refeição" para começar' : 'Sem registros neste dia'}
                  </p>
                </div>
              </motion.div>
            )}

            {MEAL_TYPES.map((type, idx) => {
              const typeMeals = mealsByType[type] || [];
              const isExpanded = expandedMealTypes.has(type);
              const typeTotal = typeMeals.reduce((s, m) => s + m.totals.calories, 0);

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="card-premium rounded-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <button onClick={() => toggleMealType(type)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <span className="text-lg">{MEAL_TYPE_ICONS[type]}</span>
                      <div>
                        <p className="font-black text-sm">{MEAL_TYPE_LABELS[type]}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {typeMeals.length > 0 ? `${typeMeals.length} item${typeMeals.length > 1 ? 's' : ''} · ${Math.round(typeTotal)} kcal` : '0 kcal'}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => { navigateToAddMeal(type); haptic('light'); }} className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary active:scale-90">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => toggleMealType(type)} className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-2.5 border-t border-border/20 pt-3">
                          {typeMeals.length === 0 ? (
                            <button onClick={() => navigateToAddMeal(type)} className="w-full py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium active:opacity-70">
                              <Plus size={16} className="text-primary" />
                              Adicionar {MEAL_TYPE_LABELS[type]}
                            </button>
                          ) : (
                            typeMeals.map(meal => (
                              <SwipeableRow key={meal.id} onDelete={() => setConfirmDelete(meal.id)}>
                                <div className="bg-secondary/30 rounded-xl p-3.5">
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {meal.items.map((item, i) => (
                                      <span key={i} className="text-xs bg-secondary px-2.5 py-1 rounded-lg font-bold">{item.name}</span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2 font-medium">{meal.time}</p>
                                  <div className="flex gap-3 text-xs font-bold">
                                    <span className="text-macro-calories">{Math.round(meal.totals.calories)} kcal</span>
                                    <span className="text-muted-foreground">P: <span className="text-macro-protein">{Math.round(meal.totals.protein)}g</span></span>
                                    <span className="text-muted-foreground">C: <span className="text-macro-carbs">{Math.round(meal.totals.carbs)}g</span></span>
                                    <span className="text-muted-foreground">G: <span className="text-macro-fat">{Math.round(meal.totals.fat)}g</span></span>
                                  </div>
                                  {meal.notes && <p className="text-xs text-muted-foreground italic mt-2">"{meal.notes}"</p>}
                                </div>
                              </SwipeableRow>
                            ))
                          )}
                          {typeMeals.length > 0 && (
                            <button onClick={() => navigateToAddMeal(type)} className="w-full py-2.5 flex items-center justify-center gap-2 text-xs text-muted-foreground font-bold active:opacity-70">
                              <Plus size={14} className="text-primary" />
                              Adicionar mais
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ─── MACROS TAB ─── */}
        {activeTab === 'Macros' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Donut card */}
            <div className="card-premium rounded-2xl p-6">
              <h2 className="font-black text-xl tracking-tight mb-6">Distribuição de Macros</h2>
              {dayTotals.calories > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="shrink-0">
                    <DonutChart segments={macroSegments} />
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Proteína', value: Math.round(dayTotals.protein), color: 'bg-macro-protein', textColor: 'text-macro-protein', pct: macroSegments[0].pct },
                      { label: 'Carbos', value: Math.round(dayTotals.carbs), color: 'bg-macro-carbs', textColor: 'text-macro-carbs', pct: macroSegments[1].pct },
                      { label: 'Gordura', value: Math.round(dayTotals.fat), color: 'bg-macro-fat', textColor: 'text-macro-fat', pct: macroSegments[2].pct },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${m.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">{m.label}</span>
                            <span className={`text-sm font-black ${m.textColor}`}>{m.pct}%</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium">{m.value}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto">
                    <TrendingUp size={28} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground font-body">Nenhum alimento registrado hoje</p>
                </div>
              )}
            </div>

            {/* Comparison with goals */}
            <div className="card-premium rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base tracking-tight">Comparação com Metas</h3>
                <button onClick={() => { setTempGoals(goals); setShowGoals(true); }} className="text-xs font-bold text-primary active:opacity-70">Editar</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Proteína', current: Math.round(dayTotals.protein), goal: goals.protein, color: 'bg-macro-protein', unit: 'g' },
                  { label: 'Carboidratos', current: Math.round(dayTotals.carbs), goal: goals.carbs, color: 'bg-macro-carbs', unit: 'g' },
                  { label: 'Gordura', current: Math.round(dayTotals.fat), goal: goals.fat, color: 'bg-macro-fat', unit: 'g' },
                ].map(m => {
                  const pct = Math.round((m.current / Math.max(m.goal, 1)) * 100);
                  return (
                    <div key={m.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{m.label}</span>
                        <span className="text-xs font-bold text-muted-foreground">{m.current}{m.unit} / {m.goal}{m.unit} <span className={pct > 100 ? 'text-destructive' : 'text-muted-foreground'}>({pct}%)</span></span>
                      </div>
                      {macroBar(m.current, m.goal, m.color)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calories detail */}
            <div className="card-premium rounded-2xl p-5 space-y-3">
              <h3 className="font-black text-base tracking-tight">Balanço Calórico</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Consumido', value: `${Math.round(dayTotals.calories)} kcal`, color: '' },
                  { label: 'Meta', value: `${goals.calories} kcal`, color: '' },
                  { label: 'Proteína (kcal)', value: `${Math.round(dayTotals.protein * 4)} kcal`, color: 'text-macro-protein' },
                  { label: 'Carbos (kcal)', value: `${Math.round(dayTotals.carbs * 4)} kcal`, color: 'text-macro-carbs' },
                  { label: 'Gordura (kcal)', value: `${Math.round(dayTotals.fat * 9)} kcal`, color: 'text-macro-fat' },
                  { label: 'Restante', value: `${Math.round(Math.abs(calorieBalance))} kcal ${calorieBalance < 0 ? 'acima' : ''}`, color: calorieBalance < 0 ? 'text-destructive' : 'text-primary' },
                ].map(item => (
                  <div key={item.label} className="bg-secondary/40 rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                    <div className={`text-sm font-black mt-0.5 ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── MICRONUTRIENTES ─── */}
            <div className="card-premium rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-black text-base tracking-tight">Micronutrientes</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">15 micros monitorados</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMicroEntry({ key: 'vitaminC', amount: '', label: '' }); setShowAddMicro(true); }}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-black active:scale-95 transition-transform shadow-glow"
                  >
                    <Pill size={14} /> Suplemento
                  </button>
                  <button
                    onClick={() => { setTempMicroGoals(microGoals); setShowMicroGoals(true); }}
                    className="flex items-center gap-1.5 bg-secondary border border-border/40 rounded-lg px-3 py-2 text-xs font-black active:scale-95 transition-transform"
                  >
                    <Target size={14} /> Metas
                  </button>
                </div>
              </div>
              <div className="space-y-3.5">
                {MICRO_DEFS.map(m => {
                  const current = dayMicros[m.key] || 0;
                  const goal = (microGoals as any)[m.key] as number;
                  const isLimit = MICRO_LIMITS.has(m.key);
                  const pct = Math.min((current / Math.max(goal, 1)) * 100, 100);
                  const over = current > goal;
                  const barColor = isLimit && over ? 'bg-destructive' : m.color;
                  const displayCurrent = (m.unit === 'g' || m.unit === 'mcg') ? Math.round(current * 10) / 10 : Math.round(current);
                  const displayGoal = (m.unit === 'g' || m.unit === 'mcg') ? Math.round(goal * 10) / 10 : goal;
                  return (
                    <div key={m.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{m.label}</span>
                          {isLimit && (
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider bg-secondary px-1.5 py-0.5 rounded">limite</span>
                          )}
                        </div>
                        <span className="text-xs font-black">
                          <span className={isLimit && over ? 'text-destructive' : m.text}>
                            {displayCurrent}{m.unit}
                          </span>
                          <span className="text-muted-foreground font-medium"> / {displayGoal}{m.unit}</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed pt-1">
                Metas baseadas em valores diários de referência para adultos. Sódio e açúcar são <span className="font-bold">limites máximos</span>. Use <span className="font-bold">Manual</span> para registrar suplementos diretamente nos totais.
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── JEJUM TAB ─── */}
        {activeTab === 'Jejum' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Timer card */}
            <div className="card-premium rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fastingData.active ? 'bg-orange-500/15' : 'bg-secondary'}`}>
                    <Timer size={20} className={fastingData.active ? 'text-orange-400' : 'text-muted-foreground'} />
                  </div>
                  <h2 className="font-black text-xl tracking-tight">Jejum Intermitente</h2>
                </div>
                {fastingData.history.length > 0 && (
                  <button onClick={() => setShowFastingHistory(true)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95">
                    <History size={16} />
                  </button>
                )}
              </div>

              {/* Goal selector */}
              {!fastingData.active && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meta de jejum</p>
                  <div className="flex gap-2">
                    {FASTING_GOALS.map(h => (
                      <button
                        key={h}
                        onClick={() => setFastingGoalHours(h)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${fastingGoalHours === h ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-secondary text-muted-foreground'}`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active fasting UI */}
              {fastingData.active ? (
                <div className="space-y-4">
                  {/* Progress arc */}
                  <div className="relative">
                    <svg viewBox="0 0 220 120" className="w-full max-w-xs mx-auto">
                      <path d="M 18,110 A 92,92 0 0 1 202,110" fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" strokeLinecap="round" />
                      {fastingPct > 0 && (
                        <path
                          d="M 18,110 A 92,92 0 0 1 202,110"
                          fill="none"
                          stroke={fastingGoalReached ? '#22c55e' : '#f97316'}
                          strokeWidth="14"
                          strokeLinecap="round"
                          pathLength="1"
                          strokeDasharray="1"
                          strokeDashoffset={1 - fastingPct}
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 max-w-xs mx-auto">
                      <div className={`text-4xl font-black leading-none ${fastingGoalReached ? 'text-green-400' : 'text-orange-400'}`}>
                        {formatDuration(fastingElapsedMinutes)}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground mt-1">
                        {fastingGoalReached ? '🎉 Meta atingida!' : `meta: ${fastingGoalHours}h`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Iniciou</div>
                      <div className="text-sm font-black mt-0.5">{new Date(fastingData.active.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Progresso</div>
                      <div className="text-sm font-black mt-0.5 text-orange-400">{Math.round(fastingPct * 100)}%</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowConfirmStopFast(true)}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl py-3.5 font-black text-sm active:scale-[0.98] transition-transform"
                  >
                    <StopCircle size={18} />
                    Encerrar Jejum
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { startFast(); haptic('light'); toast({ title: `Jejum de ${fastingGoalHours}h iniciado!` }); }}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl py-4 font-black text-base active:scale-[0.98] transition-transform hover:bg-orange-500/15"
                >
                  <Timer size={20} />
                  Iniciar Jejum
                </button>
              )}
            </div>

            {/* Last fast summary */}
            {fastingData.history.length > 0 && (
              <div className="card-premium rounded-2xl p-5 space-y-3">
                <h3 className="font-black text-base tracking-tight">Histórico Recente</h3>
                {fastingData.history.slice(0, 5).map(session => (
                  <SwipeableRow key={session.id} onDelete={() => setDeleteTargetId(session.id)}>
                    <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">{new Date(session.startedAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {session.endedAt && ` → ${new Date(session.endedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      <span className={`text-lg font-black ${(session.durationMinutes || 0) >= 960 ? 'text-green-400' : 'text-orange-400'}`}>
                        {session.durationMinutes !== undefined ? formatDuration(session.durationMinutes) : '—'}
                      </span>
                    </div>
                  </SwipeableRow>
                ))}
                {fastingData.history.length > 5 && (
                  <button onClick={() => setShowFastingHistory(true)} className="w-full text-center text-xs font-bold text-muted-foreground py-1 active:opacity-70">
                    Ver todos ({fastingData.history.length})
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Goals dialog */}
      <Dialog open={showGoals} onOpenChange={setShowGoals}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Metas Diárias</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMacroMode('grams')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${macroMode === 'grams' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>Gramas</button>
              <button onClick={() => setMacroMode('percent')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${macroMode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>Percentual</button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Calorias (kcal)</label>
              <input type="number" inputMode="decimal" value={tempGoals.calories} onChange={e => setTempGoals(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {macroMode === 'grams' ? (
              [{ label: 'Proteína (g)', field: 'protein' as const }, { label: 'Carboidratos (g)', field: 'carbs' as const }, { label: 'Gordura (g)', field: 'fat' as const }].map(({ label, field }) => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-body">{label}</label>
                    <span className="text-[10px] text-muted-foreground/60">{calcMacroPercent(tempGoals[field], field === 'fat' ? 9 : 4)}%</span>
                  </div>
                  <input type="number" inputMode="decimal" value={tempGoals[field]} onChange={e => setTempGoals(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))
            ) : (
              [{ label: 'Proteína (%)', field: 'protein' as const, cpg: 4 }, { label: 'Carboidratos (%)', field: 'carbs' as const, cpg: 4 }, { label: 'Gordura (%)', field: 'fat' as const, cpg: 9 }].map(({ label, field, cpg }) => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-body">{label}</label>
                    <span className="text-[10px] text-muted-foreground/60">= {tempGoals[field]}g</span>
                  </div>
                  <input type="number" inputMode="decimal" value={calcMacroPercent(tempGoals[field], cpg)} onChange={e => setMacroFromPercent(field, parseInt(e.target.value) || 0)} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))
            )}
            <button onClick={() => { setGoals(tempGoals); setShowGoals(false); toast({ title: 'Metas atualizadas!' }); }} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm">Salvar Metas</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Water settings */}
      <Dialog open={showWaterSettings} onOpenChange={setShowWaterSettings}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Meta de Água Diária</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Meta diária (ml)</label>
              <input type="number" inputMode="numeric" value={tempWaterGoal} onChange={e => setTempWaterGoal(parseInt(e.target.value) || 0)} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-[10px] text-muted-foreground/60 font-body">= {(tempWaterGoal / 1000).toFixed(1)} litros</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[2000, 2500, 3000, 3500, 4000].map(ml => (
                <button key={ml} onClick={() => setTempWaterGoal(ml)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tempWaterGoal === ml ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-secondary text-muted-foreground'}`}>{ml / 1000}L</button>
              ))}
            </div>
            <button onClick={() => { setWaterGoal(Math.max(100, tempWaterGoal)); setShowWaterSettings(false); toast({ title: 'Meta de água atualizada!' }); }} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm">Salvar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Excluir Refeição?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body mt-1">Esta ação não pode ser desfeita.</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setConfirmDelete(null)} className="bg-secondary rounded-xl py-2.5 font-medium text-sm">Cancelar</button>
            <button onClick={() => confirmDelete && handleDeleteMeal(confirmDelete)} className="bg-destructive text-destructive-foreground rounded-xl py-2.5 font-semibold text-sm">Excluir</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm stop fasting */}
      <Dialog open={showConfirmStopFast} onOpenChange={setShowConfirmStopFast}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Encerrar Jejum?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Duração atual: <span className="text-foreground font-black">{formatDuration(fastingElapsedMinutes)}</span>
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setShowConfirmStopFast(false)} className="bg-secondary rounded-xl py-2.5 font-medium text-sm">Continuar</button>
            <button onClick={() => { stopFast(); haptic('success'); setShowConfirmStopFast(false); toast({ title: `Jejum encerrado! ${formatDuration(fastingElapsedMinutes)}` }); }} className="bg-orange-500 text-white rounded-xl py-2.5 font-semibold text-sm">Encerrar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fasting history */}
      <Dialog open={showFastingHistory} onOpenChange={setShowFastingHistory}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Histórico de Jejuns</DialogTitle></DialogHeader>
      <div className="space-y-2 mt-2 max-h-72 overflow-y-auto">
            {fastingData.history.slice(0, 20).map(session => (
              <SwipeableRow key={session.id} onDelete={() => setDeleteTargetId(session.id)}>
                <div className="flex items-center justify-between gap-3 bg-secondary/40 rounded-xl px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{new Date(session.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {session.endedAt && ` → ${new Date(session.endedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <span className="text-base font-black text-orange-400 shrink-0">{session.durationMinutes !== undefined ? formatDuration(session.durationMinutes) : '—'}</span>
                </div>
              </SwipeableRow>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit micronutrient goals */}
      <Dialog open={showMicroGoals} onOpenChange={setShowMicroGoals}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Metas de Micronutrientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Ajuste suas metas diárias. Os valores ficam salvos no aparelho.
            </p>
            <div className="space-y-3">
              {MICRO_DEFS.map(m => {
                const isLimit = MICRO_LIMITS.has(m.key);
                return (
                  <div key={m.key} className="space-y-1.5">
                    <label className="text-xs font-bold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.color}`} />
                      <span className="flex-1">{m.label}</span>
                      {isLimit && (
                        <span className="text-[9px] font-black text-orange-300 uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">limite</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={tempMicroGoals[m.key]}
                        onChange={e => setTempMicroGoals(prev => ({ ...prev, [m.key]: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-secondary rounded-xl px-3.5 py-3 pr-12 text-base font-bold outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">{m.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="sticky bottom-0 -mx-5 -mb-5 px-5 pt-3 pb-5 bg-gradient-to-t from-card via-card to-card/80 space-y-2 border-t border-border/30">
              <button
                onClick={() => {
                  setMicroGoals(tempMicroGoals);
                  setShowMicroGoals(false);
                  haptic('success');
                  toast({ title: 'Metas de micros atualizadas!' });
                }}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-black text-sm active:scale-[0.98] transition-transform shadow-glow"
              >
                Salvar Metas
              </button>
              <button
                onClick={() => setTempMicroGoals(DEFAULT_MICRO_GOALS)}
                className="w-full bg-secondary rounded-xl py-2.5 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Sparkles size={13} /> Restaurar valores padrão
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual micronutrient entry */}
      <Dialog open={showAddMicro} onOpenChange={setShowAddMicro}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Micro Manualmente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Use para registrar suplementos (ex: vitamina D, ômega 3) ou alimentos sem cadastro. O valor é somado nos totais do dia.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Micronutriente</label>
              <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {MICRO_DEFS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMicroEntry(prev => ({ ...prev, key: m.key }))}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      microEntry.key === m.key ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-transparent'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${m.color} shrink-0`} />
                    <span className="truncate text-left">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quantidade ({MICRO_DEFS.find(d => d.key === microEntry.key)?.unit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="Ex: 1000"
                  value={microEntry.amount}
                  onChange={e => setMicroEntry(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-secondary rounded-xl px-3.5 py-3.5 pr-14 text-lg font-bold outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/40"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  {MICRO_DEFS.find(d => d.key === microEntry.key)?.unit}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Suplemento Vitamina C 1g"
                value={microEntry.label}
                onChange={e => setMicroEntry(prev => ({ ...prev, label: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/40"
              />
            </div>

            <button
              onClick={() => {
                const value = parseFloat(microEntry.amount);
                if (!value || value <= 0) {
                  toast({ title: 'Informe uma quantidade válida' });
                  return;
                }
                const def = MICRO_DEFS.find(d => d.key === microEntry.key)!;
                const itemName = microEntry.label.trim() || `${def.label} (manual)`;
                addMeal({
                  date: selectedDate,
                  time: new Date().toTimeString().slice(0, 5),
                  type: 'outro',
                  isMicroSupplement: true,
                  confidence: 'manual',
                  items: [{
                    name: itemName,
                    portion: `${value} ${def.unit}`,
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    [microEntry.key]: value,
                  }],
                  totals: {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    [microEntry.key]: value,
                  },
                });
                setShowAddMicro(false);
                haptic('success');
                toast({ title: `${def.label} +${value}${def.unit} registrado!` });
              }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-glow"
            >
              <Plus size={16} /> Adicionar ao dia
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Excluir jejum?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body mt-1">Este item será removido permanentemente do histórico.</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setDeleteTargetId(null)} className="bg-secondary rounded-xl py-2.5 font-medium text-sm">Cancelar</button>
            <button
              onClick={() => {
                if (deleteTargetId) deleteFasting(deleteTargetId);
                setDeleteTargetId(null);
                toast({ title: 'Jejum removido' });
              }}
              className="bg-destructive text-destructive-foreground rounded-xl py-2.5 font-semibold text-sm"
            >
              Excluir
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
