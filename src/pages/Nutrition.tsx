import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronRight, Trash2, UtensilsCrossed, Target, Droplets, Plus, Minus, Scale, Settings2, GlassWater } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useMeals, useNutritionGoals, useWaterLog, useWaterGoal } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptic';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: 'Café da Manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  jantar: 'Jantar',
  outro: 'Outro',
};

const WATER_PRESETS = [150, 200, 300, 500];

export default function Nutrition() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { meals, deleteMeal } = useMeals();
  const [goals, setGoals] = useNutritionGoals();
  const { getTodayWater, addWater, getWaterForDate } = useWaterLog();
  const [waterGoal, setWaterGoal] = useWaterGoal();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showGoals, setShowGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState(goals);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showWaterSettings, setShowWaterSettings] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState(waterGoal);
  const [customWaterMl, setCustomWaterMl] = useState('');
  const [macroMode, setMacroMode] = useState<'grams' | 'percent'>('grams');

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const todayWater = isToday ? getTodayWater() : getWaterForDate(selectedDate);

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

  const calorieBalance = useMemo(() => {
    const remaining = goals.calories - dayTotals.calories;
    return remaining;
  }, [goals.calories, dayTotals.calories]);

  return (
    <PageShell title="Nutrição">
      <div className="max-w-lg mx-auto space-y-6 pt-2">
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

        {/* Daily macros dashboard */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-xl tracking-tight">Resumo do Dia</h2>
            <button onClick={() => { setTempGoals(goals); setShowGoals(true); }} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary active:scale-95 hover:bg-secondary/80 transition-colors">
              <Target size={18} />
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-5xl font-black text-primary tracking-tighter">{Math.round(dayTotals.calories)}</p>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">de {goals.calories} kcal</p>
            <div className="pt-2">
              {macroBar(dayTotals.calories, goals.calories, 'bg-orange-400')}
            </div>
          </div>

          {/* Calorie balance */}
          <div className={`text-center py-3 rounded-xl text-sm font-black tracking-tight ${
            calorieBalance > 0 ? 'bg-green-500/10 text-green-400' : calorieBalance < -200 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            {calorieBalance > 0
              ? `${Math.round(calorieBalance)} kcal restantes`
              : calorieBalance === 0
              ? 'Meta atingida!'
              : `${Math.abs(Math.round(calorieBalance))} kcal acima da meta`}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: 'Proteína', current: Math.round(dayTotals.protein * 10) / 10, goal: goals.protein, unit: 'g', color: 'bg-red-400' },
              { label: 'Carbos', current: Math.round(dayTotals.carbs * 10) / 10, goal: goals.carbs, unit: 'g', color: 'bg-blue-400' },
              { label: 'Gordura', current: Math.round(dayTotals.fat * 10) / 10, goal: goals.fat, unit: 'g', color: 'bg-yellow-400' },
            ].map(m => (
              <div key={m.label} className="space-y-2">
                <div className="text-center space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">{m.label}</span>
                  <span className="text-sm font-black block text-foreground">{m.current}<span className="text-[10px] text-muted-foreground font-medium ml-0.5">/{m.goal}{m.unit}</span></span>
                </div>
                {macroBar(m.current, m.goal, m.color)}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Water tracking */}
        {isToday && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="card-premium rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Droplets size={20} className="text-blue-400" />
                </div>
                <h3 className="font-black text-xl tracking-tight">Água</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xl font-black text-blue-400 leading-none block">{(todayWater / 1000).toFixed(2).replace('.', ',')}L</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">/ {(waterGoal / 1000).toFixed(1).replace('.', ',')}L</span>
                </div>
                <button
                  onClick={() => { setTempWaterGoal(waterGoal); setShowWaterSettings(true); }}
                  className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform hover:bg-secondary/80"
                >
                  <Settings2 size={18} />
                </button>
              </div>
            </div>

            {/* Water progress */}
            <div className="space-y-2.5">
              <div className="w-full h-4 bg-secondary rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                <span>{waterGlasses} copos de 250ml</span>
                <span>{Math.max(0, waterGoal - todayWater)}ml restantes</span>
              </div>
            </div>

            {/* Water buttons */}
            <div className="flex gap-2">
              {WATER_PRESETS.map(ml => (
                <button
                  key={ml}
                  onClick={() => { addWater(ml); haptic('light'); }}
                  className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl py-3 text-sm font-black active:scale-95 transition-transform hover:bg-blue-500/20"
                >
                  +{ml < 1000 ? `${ml}ml` : `${ml / 1000}L`}
                </button>
              ))}
              <button
                onClick={() => { addWater(-150); haptic('light'); }}
                className="w-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform hover:bg-secondary/80"
              >
                <Minus size={18} />
              </button>
            </div>

            {/* Custom water amount */}
            <div className="flex gap-2 pt-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Quantidade personalizada (ml)"
                value={customWaterMl}
                onChange={e => setCustomWaterMl(e.target.value)}
                className="flex-1 bg-secondary rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400/40 placeholder:text-muted-foreground/50 placeholder:font-medium"
              />
              <button
                onClick={addCustomWater}
                disabled={!customWaterMl || parseInt(customWaterMl) <= 0}
                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl px-5 py-3.5 text-sm font-black disabled:opacity-40 active:scale-95 transition-transform flex items-center gap-2 hover:bg-blue-500/20"
              >
                <GlassWater size={18} /> Adicionar
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/nutricao/camera')}
            className="bg-primary text-primary-foreground rounded-2xl p-5 flex items-center justify-center gap-3 font-black text-sm active:scale-[0.97] transition-transform shadow-glow"
          >
            <Camera size={20} />
            Registrar Refeição
          </button>
          <button
            onClick={() => navigate('/peso')}
            className="card-premium rounded-2xl p-5 flex items-center justify-center gap-3 font-black text-sm active:scale-[0.97] transition-transform hover:border-primary/30"
          >
            <Scale size={20} className="text-primary" />
            Peso Corporal
          </button>
        </div>

        {/* Meals list */}
        <div className="space-y-4 pb-6">
          <h3 className="font-black text-xl tracking-tight px-1">Refeições {isToday ? 'de hoje' : 'do dia'}</h3>
          {dayMeals.length === 0 ? (
            <div className="card-premium rounded-2xl p-10 text-center space-y-4">
              <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <UtensilsCrossed size={36} className="text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-bold">Nenhuma refeição registrada</p>
                <p className="text-sm text-muted-foreground font-body mt-1">Registre o que você come para acompanhar suas metas</p>
              </div>
              <button
                onClick={() => navigate('/nutricao/camera')}
                className="text-sm text-primary font-bold px-6 py-2.5 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
              >
                Adicionar refeição
              </button>
            </div>
          ) : (
            dayMeals.map((meal, idx) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="card-premium rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-lg">{MEAL_TYPE_LABELS[meal.type] || meal.type}</p>
                    <p className="text-sm font-bold text-muted-foreground mt-0.5">{meal.time}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(meal.id)}
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-95"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meal.items.map((item, i) => (
                    <span key={i} className="text-xs bg-secondary/80 px-3 py-1.5 rounded-lg font-bold text-foreground">{item.name}</span>
                  ))}
                </div>
                <div className="flex gap-4 text-xs font-bold bg-secondary/30 p-3 rounded-xl">
                  <span className="text-orange-400">{Math.round(meal.totals.calories)} kcal</span>
                  <span className="text-muted-foreground">P: <span className="text-foreground">{Math.round(meal.totals.protein * 10) / 10}g</span></span>
                  <span className="text-muted-foreground">C: <span className="text-foreground">{Math.round(meal.totals.carbs * 10) / 10}g</span></span>
                  <span className="text-muted-foreground">G: <span className="text-foreground">{Math.round(meal.totals.fat * 10) / 10}g</span></span>
                </div>
                {meal.notes && (
                  <p className="text-sm text-foreground font-body bg-secondary/30 p-3 rounded-xl border border-border/30">"{meal.notes}"</p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Goals dialog - enhanced with % mode */}
      <Dialog open={showGoals} onOpenChange={setShowGoals}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Metas Diárias</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setMacroMode('grams')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${macroMode === 'grams' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                Gramas
              </button>
              <button
                onClick={() => setMacroMode('percent')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${macroMode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                Percentual
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Calorias (kcal)</label>
              <input
                type="number"
                inputMode="decimal"
                value={tempGoals.calories}
                onChange={e => setTempGoals(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
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
                      <span className="text-[10px] text-muted-foreground/60 font-body">
                        {calcMacroPercent(tempGoals[field], field === 'fat' ? 9 : 4)}%
                      </span>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={tempGoals[field]}
                      onChange={e => setTempGoals(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
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
                        <span className="text-[10px] text-muted-foreground/60 font-body">
                          = {tempGoals[field]}g
                        </span>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={pct}
                        onChange={e => setMacroFromPercent(field, parseInt(e.target.value) || 0)}
                        className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  );
                })}
                {(() => {
                  const totalPct = calcMacroPercent(tempGoals.protein, 4) + calcMacroPercent(tempGoals.carbs, 4) + calcMacroPercent(tempGoals.fat, 9);
                  return totalPct !== 100 ? (
                    <p className={`text-[10px] font-body ${Math.abs(totalPct - 100) > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                      Total: {totalPct}% (ideal: 100%)
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-400 font-body">Total: 100%</p>
                  );
                })()}
              </>
            )}

            <button
              onClick={() => { setGoals(tempGoals); setShowGoals(false); toast({ title: 'Metas atualizadas!' }); }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm"
            >
              Salvar Metas
            </button>
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
              <input
                type="number"
                inputMode="numeric"
                value={tempWaterGoal}
                onChange={e => setTempWaterGoal(parseInt(e.target.value) || 0)}
                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground/60 font-body">= {(tempWaterGoal / 1000).toFixed(1)} litros</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[2000, 2500, 3000, 3500, 4000].map(ml => (
                <button
                  key={ml}
                  onClick={() => setTempWaterGoal(ml)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tempWaterGoal === ml ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-secondary text-muted-foreground'}`}
                >
                  {ml / 1000}L
                </button>
              ))}
            </div>
            <button
              onClick={() => { setWaterGoal(Math.max(100, tempWaterGoal)); setShowWaterSettings(false); toast({ title: 'Meta de água atualizada!' }); }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm"
            >
              Salvar
            </button>
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
    </PageShell>
  );
}
