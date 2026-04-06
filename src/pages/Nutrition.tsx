import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronRight, Trash2, TrendingUp, UtensilsCrossed, Target, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useMeals, useNutritionGoals } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: '☕ Café da Manhã',
  almoco: '🍽️ Almoço',
  lanche: '🥪 Lanche',
  jantar: '🌙 Jantar',
  outro: '🍴 Outro',
};

export default function Nutrition() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { meals, deleteMeal } = useMeals();
  const [goals, setGoals] = useNutritionGoals();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showGoals, setShowGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState(goals);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateLabel = isToday ? 'Hoje' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const macroBar = (current: number, goal: number, color: string) => {
    const pct = Math.min((current / goal) * 100, 100);
    return (
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  const handleDeleteMeal = (id: string) => {
    deleteMeal(id);
    setConfirmDelete(null);
    toast({ title: 'Refeição removida' });
  };

  return (
    <PageShell title="Nutrição">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Date selector */}
        <div className="flex items-center justify-between">
          <button onClick={() => changeDate(-1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold capitalize">{dateLabel}</span>
          <button onClick={() => changeDate(1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Daily macros dashboard */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Resumo do Dia</h2>
            <button onClick={() => { setTempGoals(goals); setShowGoals(true); }} className="text-xs text-primary font-medium flex items-center gap-1">
              <Target size={12} /> Metas
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-4xl font-black text-primary">{dayTotals.calories}</p>
            <p className="text-xs text-muted-foreground font-body">de {goals.calories} kcal</p>
            {macroBar(dayTotals.calories, goals.calories, 'bg-orange-400')}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Proteína', current: dayTotals.protein, goal: goals.protein, unit: 'g', color: 'bg-red-400' },
              { label: 'Carbos', current: dayTotals.carbs, goal: goals.carbs, unit: 'g', color: 'bg-blue-400' },
              { label: 'Gordura', current: dayTotals.fat, goal: goals.fat, unit: 'g', color: 'bg-yellow-400' },
            ].map(m => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground font-body">{m.label}</span>
                  <span className="text-xs font-medium">{m.current}/{m.goal}{m.unit}</span>
                </div>
                {macroBar(m.current, m.goal, m.color)}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Add meal button */}
        <button
          onClick={() => navigate('/nutricao/camera')}
          className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold active:scale-[0.98] transition-transform"
        >
          <Camera size={20} />
          Registrar Refeição
        </button>

        {/* Meals list */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm px-1">Refeições do dia</h3>
          {dayMeals.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center space-y-3">
              <UtensilsCrossed size={36} className="text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground font-body">Nenhuma refeição registrada</p>
            </div>
          ) : (
            dayMeals.map(meal => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{MEAL_TYPE_LABELS[meal.type] || meal.type}</p>
                    <p className="text-xs text-muted-foreground font-body">{meal.time}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setConfirmDelete(meal.id)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {meal.items.map((item, i) => (
                    <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-lg font-body">{item.name}</span>
                  ))}
                </div>
                <div className="flex gap-4 text-xs font-body text-muted-foreground">
                  <span className="text-orange-400 font-medium">{meal.totals.calories} kcal</span>
                  <span>P: {meal.totals.protein}g</span>
                  <span>C: {meal.totals.carbs}g</span>
                  <span>G: {meal.totals.fat}g</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Goals dialog */}
      <Dialog open={showGoals} onOpenChange={setShowGoals}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Metas Diárias</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { label: 'Calorias (kcal)', field: 'calories' as const },
              { label: 'Proteína (g)', field: 'protein' as const },
              { label: 'Carboidratos (g)', field: 'carbs' as const },
              { label: 'Gordura (g)', field: 'fat' as const },
            ].map(({ label, field }) => (
              <div key={field} className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">{label}</label>
                <input
                  type="number"
                  value={tempGoals[field]}
                  onChange={e => setTempGoals(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
            <button
              onClick={() => { setGoals(tempGoals); setShowGoals(false); toast({ title: 'Metas atualizadas' }); }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm"
            >
              Salvar Metas
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
          <p className="text-sm text-muted-foreground font-body">Esta ação não pode ser desfeita.</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setConfirmDelete(null)} className="bg-secondary rounded-xl py-2.5 font-medium text-sm">Cancelar</button>
            <button onClick={() => confirmDelete && handleDeleteMeal(confirmDelete)} className="bg-destructive text-destructive-foreground rounded-xl py-2.5 font-semibold text-sm">Excluir</button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
