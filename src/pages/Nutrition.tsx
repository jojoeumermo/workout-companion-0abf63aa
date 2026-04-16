import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronRight, Trash2, UtensilsCrossed, Target, Droplets, Plus, Minus, Scale, Settings2, GlassWater, Timer, StopCircle, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useMeals, useNutritionGoals, useWaterLog, useWaterGoal, useFasting } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptic';

const MEAL_TYPES = ['cafe', 'almoco', 'jantar', 'lanche', 'outro'] as const;
const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  outro: 'Outros',
};
const MEAL_TYPE_ICONS: Record<string, string> = {
  cafe: '☀️',
  almoco: '🍽️',
  jantar: '🌙',
  lanche: '🍎',
  outro: '📋',
};

const WATER_PRESETS = [150, 200, 300, 500];

// SVG calorie circle
function CalorieCircle({ consumed, goal }: { consumed: number; goal: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const safeGoal = goal > 0 ? goal : 1;
  const pct = Math.min(consumed / safeGoal, 1);
  const over = pct >= 1;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
      <svg viewBox="0 0 124 124" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="62" cy="62" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
        <circle
          cx="62" cy="62" r={radius}
          fill="none"
          stroke={over ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="relative text-center z-10">
        <span className={`text-2xl font-black leading-none block ${over ? 'text-destructive' : 'text-foreground'}`}>
          {Math.round(consumed)}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mt-0.5">kcal</span>
      </div>
    </div>
  );
}

// Format duration from minutes
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Live fasting elapsed time
function useFastingElapsed(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) { setElapsed(''); return; }
    const update = () => {
      const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
      setElapsed(formatDuration(minutes));
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

export default function Nutrition() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { meals, deleteMeal } = useMeals();
  const [goals, setGoals] = useNutritionGoals();
  const { getTodayWater, addWater, getWaterForDate } = useWaterLog();
  const [waterGoal, setWaterGoal] = useWaterGoal();
  const { data: fastingData, start: startFast, stop: stopFast } = useFasting();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const todayWater = isToday ? getTodayWater() : getWaterForDate(selectedDate);
  const fastingElapsed = useFastingElapsed(fastingData.active?.startedAt ?? null);

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

  const mealsByType = useMemo(() => {
    const map: Record<string, typeof dayMeals> = {};
    MEAL_TYPES.forEach(t => { map[t] = []; });
    dayMeals.forEach(m => {
      const key = MEAL_TYPES.includes(m.type as any) ? m.type : 'outro';
      map[key] = [...(map[key] || []), m];
    });
    return map;
  }, [dayMeals]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const dateLabel = isToday
    ? 'Hoje'
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const macroBar = (current: number, goal: number, color: string) => {
    const safeGoal = goal > 0 ? goal : 1;
    const pct = Math.min((current / safeGoal) * 100, 100);
    const over = (current / safeGoal) > 1;
    return (
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : color}`} style={{ width: `${pct}%` }} />
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
    if (ml > 0 && ml <= 5000) {
      addWater(ml);
      haptic('light');
      setCustomWaterMl('');
    }
  };

  const calcMacroPercent = (grams: number, calPerGram: number) => {
    if (tempGoals.calories <= 0) return 0;
    return Math.round((grams * calPerGram / tempGoals.calories) * 100);
  };

  const setMacroFromPercent = (field: 'protein' | 'carbs' | 'fat', percent: number) => {
    const calPerGram = field === 'fat' ? 9 : 4;
    const grams = Math.round((percent / 100) * tempGoals.calories / calPerGram);
    setTempGoals(prev => ({ ...prev, [field]: grams }));
  };

  const calorieBalance = goals.calories - dayTotals.calories;

  const toggleMealType = (type: string) => {
    setExpandedMealTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const navigateToAddMeal = (type: string) => {
    navigate('/nutricao/camera', { state: { presetType: type } });
  };

  return (
    <PageShell title="Nutrição">
      <div className="max-w-lg mx-auto space-y-5 pt-2">

        {/* Date selector */}
        <div className="flex items-center justify-between card-premium p-3 rounded-2xl">
          <button onClick={() => changeDate(-1)} className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform hover:bg-secondary/80">
            <ChevronLeft size={20} />
          </button>
          <span className="font-black text-lg capitalize tracking-tight">{dateLabel}</span>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform hover:bg-secondary/80"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calorie + Macros card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-xl tracking-tight">Resumo do Dia</h2>
            <button onClick={() => { setTempGoals(goals); setShowGoals(true); }} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary active:scale-95 hover:bg-secondary/80 transition-colors">
              <Target size={18} />
            </button>
          </div>

          <div className="flex items-center gap-5">
            <CalorieCircle consumed={dayTotals.calories} goal={goals.calories} />
            <div className="flex-1 space-y-3">
              <div className={`text-center py-2.5 rounded-xl text-xs font-black tracking-tight ${
                calorieBalance > 0 ? 'bg-green-500/10 text-green-400' : calorieBalance < -200 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                {calorieBalance > 0
                  ? `${Math.round(calorieBalance)} kcal restantes`
                  : calorieBalance === 0
                  ? 'Meta atingida!'
                  : `${Math.abs(Math.round(calorieBalance))} kcal acima`}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Meta', value: `${goals.calories}` },
                  { label: 'Consumido', value: `${Math.round(dayTotals.calories)}` },
                  { label: 'Exercício', value: '0' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</div>
                    <div className="text-sm font-black">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/30">
            {[
              { label: 'Proteína', current: Math.round(dayTotals.protein * 10) / 10, goal: goals.protein, color: 'bg-red-400', accent: 'text-red-400' },
              { label: 'Carbos', current: Math.round(dayTotals.carbs * 10) / 10, goal: goals.carbs, color: 'bg-blue-400', accent: 'text-blue-400' },
              { label: 'Gordura', current: Math.round(dayTotals.fat * 10) / 10, goal: goals.fat, color: 'bg-yellow-400', accent: 'text-yellow-400' },
            ].map(m => (
              <div key={m.label} className="space-y-2">
                <div className="text-center space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">{m.label}</span>
                  <span className={`text-sm font-black block ${m.accent}`}>
                    {m.current}<span className="text-[10px] text-muted-foreground font-medium">/{m.goal}g</span>
                  </span>
                </div>
                {macroBar(m.current, m.goal, m.color)}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick action — register meal */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/nutricao/camera')}
            className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-2.5 font-black text-sm active:scale-[0.97] transition-transform shadow-glow"
          >
            <Camera size={18} />
            Registrar Refeição
          </button>
          <button
            onClick={() => navigate('/peso')}
            className="card-premium rounded-2xl p-4 flex items-center justify-center gap-2.5 font-black text-sm active:scale-[0.97] transition-transform hover:border-primary/30"
          >
            <Scale size={18} className="text-primary" />
            Peso Corporal
          </button>
        </div>

        {/* Fasting timer */}
        {isToday && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="card-premium rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fastingData.active ? 'bg-orange-500/10' : 'bg-secondary'}`}>
                  <Timer size={20} className={fastingData.active ? 'text-orange-400' : 'text-muted-foreground'} />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight">Jejum Intermitente</h3>
                  {fastingData.active && (
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Iniciado às {new Date(fastingData.active.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              {fastingData.history.length > 0 && (
                <button
                  onClick={() => setShowFastingHistory(true)}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 active:scale-95 transition-transform"
                >
                  <History size={16} />
                </button>
              )}
            </div>

            {fastingData.active ? (
              <div className="space-y-4">
                <div className="text-center py-4 bg-orange-500/8 rounded-2xl border border-orange-500/20">
                  <div className="text-4xl font-black text-orange-400 tracking-tight">{fastingElapsed || '0m'}</div>
                  <div className="text-xs font-bold text-orange-400/70 uppercase tracking-widest mt-1">em jejum</div>
                </div>
                <button
                  onClick={() => setShowConfirmStopFast(true)}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl py-3 font-black text-sm active:scale-[0.98] transition-transform hover:bg-orange-500/20"
                >
                  <StopCircle size={18} />
                  Encerrar Jejum
                </button>
              </div>
            ) : (
              <button
                onClick={() => { startFast(); haptic('light'); toast({ title: 'Jejum iniciado!' }); }}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-foreground rounded-xl py-3 font-black text-sm active:scale-[0.98] transition-transform hover:bg-secondary/80"
              >
                <Timer size={18} className="text-primary" />
                Iniciar Jejum
              </button>
            )}
          </motion.div>
        )}

        {/* Water tracking */}
        {isToday && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="card-premium rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Droplets size={20} className="text-blue-400" />
                </div>
                <h3 className="font-black text-base tracking-tight">Água</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xl font-black text-blue-400 leading-none block">{(todayWater / 1000).toFixed(2).replace('.', ',')}L</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">/ {(waterGoal / 1000).toFixed(1).replace('.', ',')}L</span>
                </div>
                <button onClick={() => { setTempWaterGoal(waterGoal); setShowWaterSettings(true); }} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform hover:bg-secondary/80">
                  <Settings2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${waterPct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-0.5">
                <span>{waterGlasses} copos de 250ml</span>
                <span>{Math.max(0, waterGoal - todayWater)}ml restantes</span>
              </div>
            </div>

            <div className="flex gap-2">
              {WATER_PRESETS.map(ml => (
                <button key={ml} onClick={() => { addWater(ml); haptic('light'); }} className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl py-2.5 text-xs font-black active:scale-95 transition-transform hover:bg-blue-500/20">
                  +{ml < 1000 ? `${ml}ml` : `${ml / 1000}L`}
                </button>
              ))}
              <button onClick={() => { addWater(-150); haptic('light'); }} className="w-11 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform hover:bg-secondary/80">
                <Minus size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Personalizado (ml)"
                value={customWaterMl}
                onChange={e => setCustomWaterMl(e.target.value)}
                className="flex-1 min-w-0 bg-secondary rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400/40 placeholder:text-muted-foreground/50 placeholder:font-medium"
              />
              <button onClick={addCustomWater} disabled={!customWaterMl || parseInt(customWaterMl) <= 0} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl px-4 py-3 disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center hover:bg-blue-500/20 shrink-0">
                <GlassWater size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Meal sections by type */}
        <div className="space-y-3 pb-4">
          <h3 className="font-black text-xl tracking-tight px-1">Refeições {isToday ? 'de hoje' : 'do dia'}</h3>

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
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => toggleMealType(type)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
                  >
                    <span className="text-xl">{MEAL_TYPE_ICONS[type]}</span>
                    <div>
                      <p className="font-black text-base">{MEAL_TYPE_LABELS[type]}</p>
                      {typeMeals.length > 0 && (
                        <p className="text-xs text-muted-foreground font-medium">
                          {typeMeals.length} item{typeMeals.length > 1 ? 's' : ''} · {Math.round(typeTotal)} kcal
                        </p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { navigateToAddMeal(type); haptic('light'); }}
                      className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-transform hover:bg-primary/20"
                    >
                      <Plus size={18} />
                    </button>
                    <button onClick={() => toggleMealType(type)} className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {typeMeals.length === 0 ? (
                        <div className="px-4 pb-4 pt-1">
                          <button
                            onClick={() => navigateToAddMeal(type)}
                            className="w-full border border-dashed border-border/50 rounded-xl py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium hover:border-primary/30 hover:text-primary transition-colors active:scale-[0.98]"
                          >
                            <Plus size={16} />
                            Adicionar {MEAL_TYPE_LABELS[type]}
                          </button>
                        </div>
                      ) : (
                        <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                          {typeMeals.map(meal => (
                            <div key={meal.id} className="bg-secondary/30 rounded-xl p-3.5 space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-1.5">
                                    {meal.items.map((item, i) => (
                                      <span key={i} className="text-xs bg-secondary px-2.5 py-1 rounded-lg font-bold">{item.name}</span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{meal.time}</p>
                                </div>
                                <button
                                  onClick={() => setConfirmDelete(meal.id)}
                                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-95 shrink-0"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              <div className="flex gap-3 text-xs font-bold">
                                <span className="text-orange-400">{Math.round(meal.totals.calories)} kcal</span>
                                <span className="text-muted-foreground">P: <span className="text-foreground">{Math.round(meal.totals.protein)}g</span></span>
                                <span className="text-muted-foreground">C: <span className="text-foreground">{Math.round(meal.totals.carbs)}g</span></span>
                                <span className="text-muted-foreground">G: <span className="text-foreground">{Math.round(meal.totals.fat)}g</span></span>
                              </div>
                              {meal.notes && (
                                <p className="text-xs text-muted-foreground font-body italic">"{meal.notes}"</p>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => navigateToAddMeal(type)}
                            className="w-full border border-dashed border-border/40 rounded-xl py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground font-bold hover:border-primary/30 hover:text-primary transition-colors active:scale-[0.98]"
                          >
                            <Plus size={14} />
                            Adicionar mais
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
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
              <>
                {[
                  { label: 'Proteína (g)', field: 'protein' as const },
                  { label: 'Carboidratos (g)', field: 'carbs' as const },
                  { label: 'Gordura (g)', field: 'fat' as const },
                ].map(({ label, field }) => (
                  <div key={field} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground font-body">{label}</label>
                      <span className="text-[10px] text-muted-foreground/60 font-body">{calcMacroPercent(tempGoals[field], field === 'fat' ? 9 : 4)}%</span>
                    </div>
                    <input type="number" inputMode="decimal" value={tempGoals[field]} onChange={e => setTempGoals(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: 'Proteína (%)', field: 'protein' as const, calPerGram: 4 },
                  { label: 'Carboidratos (%)', field: 'carbs' as const, calPerGram: 4 },
                  { label: 'Gordura (%)', field: 'fat' as const, calPerGram: 9 },
                ].map(({ label, field, calPerGram }) => {
                  const pct = calcMacroPercent(tempGoals[field], calPerGram);
                  return (
                    <div key={field} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground font-body">{label}</label>
                        <span className="text-[10px] text-muted-foreground/60 font-body">= {tempGoals[field]}g</span>
                      </div>
                      <input type="number" inputMode="decimal" value={pct} onChange={e => setMacroFromPercent(field, parseInt(e.target.value) || 0)} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  );
                })}
                {(() => {
                  const totalPct = calcMacroPercent(tempGoals.protein, 4) + calcMacroPercent(tempGoals.carbs, 4) + calcMacroPercent(tempGoals.fat, 9);
                  return totalPct !== 100 ? (
                    <p className={`text-[10px] font-body ${Math.abs(totalPct - 100) > 5 ? 'text-red-400' : 'text-yellow-400'}`}>Total: {totalPct}% (ideal: 100%)</p>
                  ) : <p className="text-[10px] text-green-400 font-body">Total: 100%</p>;
                })()}
              </>
            )}
            <button onClick={() => { setGoals(tempGoals); setShowGoals(false); toast({ title: 'Metas atualizadas!' }); }} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm">Salvar Metas</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Water settings dialog */}
      <Dialog open={showWaterSettings} onOpenChange={setShowWaterSettings}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Meta de Água Diária</DialogTitle>
          </DialogHeader>
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
          <DialogHeader>
            <DialogTitle>Excluir Refeição?</DialogTitle>
          </DialogHeader>
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
          <DialogHeader>
            <DialogTitle>Encerrar Jejum?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Duração atual: <span className="text-foreground font-black">{fastingElapsed}</span>
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setShowConfirmStopFast(false)} className="bg-secondary rounded-xl py-2.5 font-medium text-sm">Continuar</button>
            <button
              onClick={() => {
                stopFast();
                haptic('success');
                setShowConfirmStopFast(false);
                toast({ title: `Jejum encerrado! Duração: ${fastingElapsed}` });
              }}
              className="bg-orange-500 text-white rounded-xl py-2.5 font-semibold text-sm"
            >
              Encerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fasting history dialog */}
      <Dialog open={showFastingHistory} onOpenChange={setShowFastingHistory}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Histórico de Jejuns</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2 max-h-72 overflow-y-auto">
            {fastingData.history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 font-body">Nenhum jejum registrado.</p>
            ) : (
              fastingData.history.slice(0, 20).map(session => (
                <div key={session.id} className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-bold">{new Date(session.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {session.endedAt && ` → ${new Date(session.endedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <span className="text-base font-black text-orange-400">
                    {session.durationMinutes !== undefined ? formatDuration(session.durationMinutes) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
