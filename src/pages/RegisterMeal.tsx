import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Pencil, Plus, Search, ChevronRight, X, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { haptic } from '@/lib/haptic';
import { useMeals } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { NutritionItem, MealEntry } from '@/types/nutrition';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FOOD_CATEGORIES, searchFoods, calcMacrosForGrams, FoodItem } from '@/data/foodDatabase';

const MEAL_TYPES = [
  { value: 'cafe', label: '☕ Café da Manhã' },
  { value: 'almoco', label: '🍽️ Almoço' },
  { value: 'lanche', label: '🥪 Lanche' },
  { value: 'jantar', label: '🌙 Jantar' },
  { value: 'outro', label: '🍴 Outro' },
] as const;

function recalcTotals(items: NutritionItem[]) {
  const sum = (k: keyof NutritionItem) => items.reduce((s, i) => s + ((i[k] as number) || 0), 0);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: Math.round(sum('calories')),
    protein: r1(sum('protein')),
    carbs: r1(sum('carbs')),
    fat: r1(sum('fat')),
    fiber: r1(sum('fiber')),
    sodium: Math.round(sum('sodium')),
    sugar: r1(sum('sugar')),
    calcium: Math.round(sum('calcium')),
    iron: r1(sum('iron')),
    vitaminC: r1(sum('vitaminC')),
    vitaminD: r1(sum('vitaminD')),
  };
}

const MACRO_DISPLAY = [
  { key: 'calories', label: 'Calorias', unit: 'kcal', color: 'text-macro-calories', bg: 'bg-macro-calories/10' },
  { key: 'protein',  label: 'Proteína', unit: 'g',    color: 'text-macro-protein',  bg: 'bg-macro-protein/10' },
  { key: 'carbs',    label: 'Carbos',   unit: 'g',    color: 'text-macro-carbs',    bg: 'bg-macro-carbs/10' },
  { key: 'fat',      label: 'Gordura',  unit: 'g',    color: 'text-macro-fat',      bg: 'bg-macro-fat/10' },
] as const;

export default function RegisterMeal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addMeal } = useMeals();

  const [items, setItems] = useState<NutritionItem[]>([]);
  const [mealType, setMealType] = useState<MealEntry['type']>('almoco');
  const [showSaved, setShowSaved] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);

  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState('100');
  const [showCustom, setShowCustom] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '' });

  const filteredFoods = searchFoods(foodSearch, foodCategory || undefined);
  const totals = recalcTotals(items);
  const preview = selectedFood && portionGrams
    ? calcMacrosForGrams(selectedFood, parseFloat(portionGrams) || 100)
    : null;

  const addFoodItem = () => {
    if (!selectedFood) return;
    const grams = parseFloat(portionGrams) || 100;
    const macro = calcMacrosForGrams(selectedFood, grams);
    setItems(prev => [...prev, macro]);
    setSelectedFood(null);
    setPortionGrams('100');
    setFoodSearch('');
    haptic('light');
  };

  const addCustomItem = () => {
    const cal = parseFloat(customItem.calories);
    if (!customItem.name.trim() || isNaN(cal)) {
      toast({ title: 'Preencha nome e calorias', variant: 'destructive' }); return;
    }
    setItems(prev => [...prev, {
      name: customItem.name.trim(),
      portion: customItem.portion || '1 porção',
      calories: cal,
      protein: parseFloat(customItem.protein) || 0,
      carbs: parseFloat(customItem.carbs) || 0,
      fat: parseFloat(customItem.fat) || 0,
      fiber: 0,
    }]);
    setCustomItem({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '' });
    setShowCustom(false);
    haptic('light');
  };

  const removeItem = (i: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
    haptic('light');
  };

  const updateItem = (index: number, field: keyof NutritionItem, value: any) => {
    setItems(prev => {
      const arr = [...prev];
      arr[index] = { ...arr[index], [field]: value };
      return arr;
    });
  };

  const saveMeal = () => {
    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um alimento', variant: 'destructive' }); return;
    }
    const now = new Date();
    addMeal({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      type: mealType,
      items,
      totals: recalcTotals(items),
      confidence: 'manual',
    });
    haptic('success');
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); navigate('/nutricao'); }, 1500);
  };

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-4 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-card flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">Registrar Refeição</h1>
            <p className="text-xs text-muted-foreground font-body">Busque alimentos ou adicione manualmente</p>
          </div>
        </div>

        {/* Saved overlay */}
        <AnimatePresence>
          {showSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="bg-card border border-primary/30 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
                <CheckCircle2 size={48} className="text-primary mx-auto" />
                <p className="text-xl font-bold">Refeição salva!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Food search */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar alimento..."
              value={foodSearch}
              onChange={e => setFoodSearch(e.target.value)}
              enterKeyHint="search"
              className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFoodCategory('')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${!foodCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >
              Todos
            </button>
            {FOOD_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFoodCategory(foodCategory === cat ? '' : cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${foodCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Food list (shown when no food is selected) */}
        {!selectedFood && !showCustom && (
          <div className="space-y-1 max-h-[38vh] overflow-y-auto">
            {filteredFoods.length === 0 && foodSearch ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground font-body">Nenhum resultado para "{foodSearch}"</p>
                <button
                  onClick={() => { setShowCustom(true); setCustomItem(prev => ({ ...prev, name: foodSearch })); }}
                  className="mt-3 text-xs text-primary font-bold flex items-center gap-1 mx-auto"
                >
                  <Plus size={12} /> Adicionar "{foodSearch}" manualmente
                </button>
              </div>
            ) : (
              filteredFoods.map(food => (
                <button
                  key={food.id}
                  onClick={() => { setSelectedFood(food); setPortionGrams('100'); haptic('light'); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-secondary active:scale-[0.98] transition-all text-left"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{food.name}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {food.per100g.calories} kcal · P <span className="text-macro-protein">{food.per100g.protein}g</span> · C <span className="text-macro-carbs">{food.per100g.carbs}g</span> · G <span className="text-macro-fat">{food.per100g.fat}g</span>
                      <span className="opacity-50"> /100g</span>
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Manual custom entry */}
        {showCustom && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">Alimento Personalizado</p>
                <button onClick={() => setShowCustom(false)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground active:scale-90">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Nome *</label>
                  <input type="text" value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Pão caseiro"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Porção</label>
                  <input type="text" value={customItem.portion} onChange={e => setCustomItem(p => ({ ...p, portion: e.target.value }))}
                    placeholder="Ex: 100g"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-macro-calories">Calorias (kcal) *</label>
                  <input type="number" inputMode="decimal" value={customItem.calories} onChange={e => setCustomItem(p => ({ ...p, calories: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-macro-protein">Proteína (g)</label>
                  <input type="number" inputMode="decimal" value={customItem.protein} onChange={e => setCustomItem(p => ({ ...p, protein: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-macro-carbs">Carboidratos (g)</label>
                  <input type="number" inputMode="decimal" value={customItem.carbs} onChange={e => setCustomItem(p => ({ ...p, carbs: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-macro-fat">Gordura (g)</label>
                  <input type="number" inputMode="decimal" value={customItem.fat} onChange={e => setCustomItem(p => ({ ...p, fat: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <button onClick={addCustomItem}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <Plus size={16} /> Adicionar à Refeição
              </button>
            </div>
          </motion.div>
        )}

        {/* Food selected → portion picker */}
        {selectedFood && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm">{selectedFood.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{selectedFood.category}</p>
                </div>
                <button onClick={() => setSelectedFood(null)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0 active:scale-90">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Quantidade (gramas)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={portionGrams}
                  onChange={e => setPortionGrams(e.target.value)}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-center text-lg font-black outline-none focus:ring-2 focus:ring-ring"
                  placeholder="100"
                />
                <div className="flex gap-2 flex-wrap">
                  {selectedFood.commonPortions.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setPortionGrams(String(p.grams))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${portionGrams === String(p.grams) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {p.label} ({p.grams}g)
                    </button>
                  ))}
                </div>
              </div>

              {preview && (
                <div className="grid grid-cols-4 gap-2">
                  {MACRO_DISPLAY.map(m => (
                    <div key={m.key} className={`${m.bg} rounded-xl p-2.5 text-center`}>
                      <p className={`text-base font-black ${m.color}`}>{(preview as any)[m.key]}</p>
                      <p className="text-[9px] text-muted-foreground font-body">{m.unit}</p>
                      <p className="text-[9px] text-muted-foreground font-body leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addFoodItem}
                disabled={!portionGrams || parseFloat(portionGrams) <= 0}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                <Plus size={16} /> Adicionar à Refeição
              </button>
            </div>
          </motion.div>
        )}

        {/* Add custom button (visible when not in custom mode) */}
        {!selectedFood && !showCustom && (
          <button
            onClick={() => { setShowCustom(true); setCustomItem({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '' }); haptic('light'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground text-xs font-medium hover:border-primary/40 hover:text-primary transition-colors active:scale-[0.98]"
          >
            <Plus size={14} /> Adicionar alimento personalizado
          </button>
        )}

        {/* Added items */}
        {items.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Alimentos adicionados ({items.length})</h3>
              </div>

              {/* Running totals */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {MACRO_DISPLAY.map(m => (
                  <div key={m.key} className={`${m.bg} rounded-xl p-2.5 text-center`}>
                    <p className={`text-base font-black ${m.color}`}>{(totals as any)[m.key]}</p>
                    <p className="text-[9px] text-muted-foreground font-body">{m.unit}</p>
                    <p className="text-[9px] text-muted-foreground font-body leading-tight">{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="bg-card rounded-xl border border-border/40 px-3 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-body">
                          {item.portion} · <span className="text-macro-calories">{item.calories} kcal</span> ·{' '}
                          P <span className="text-macro-protein">{item.protein}g</span> ·{' '}
                          C <span className="text-macro-carbs">{item.carbs}g</span> ·{' '}
                          G <span className="text-macro-fat">{item.fat}g</span>
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingItem(i); haptic('light'); }} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground active:scale-90">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => removeItem(i)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-destructive active:scale-90">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Meal type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground px-1">Tipo de refeição</label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map(t => (
                  <button key={t.value} onClick={() => { setMealType(t.value); haptic('light'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${mealType === t.value ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-card border border-border text-muted-foreground'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveMeal}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
              <Save size={18} /> Salvar Refeição
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {items.length === 0 && !selectedFood && !showCustom && (
          <div className="text-center py-10 text-muted-foreground">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-body">Busque alimentos acima</p>
            <p className="text-xs font-body mt-1 opacity-60">ou adicione um alimento personalizado</p>
          </div>
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar Alimento</DialogTitle>
            <DialogDescription className="sr-only">Ajuste os valores nutricionais do alimento</DialogDescription>
          </DialogHeader>
          {editingItem !== null && (
            <div className="space-y-3 mt-2">
              {([
                { label: 'Nome', field: 'name', type: 'text' },
                { label: 'Porção', field: 'portion', type: 'text' },
                { label: 'Calorias (kcal)', field: 'calories', type: 'number' },
                { label: 'Proteína (g)', field: 'protein', type: 'number' },
                { label: 'Carboidratos (g)', field: 'carbs', type: 'number' },
                { label: 'Gordura (g)', field: 'fat', type: 'number' },
              ] as const).map(({ label, field, type }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted-foreground font-body">{label}</label>
                  <input
                    type={type}
                    inputMode={type === 'number' ? 'decimal' : undefined}
                    value={(items[editingItem] as any)[field] ?? ''}
                    onChange={e => updateItem(editingItem, field as keyof NutritionItem, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <button onClick={() => setEditingItem(null)} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm">Confirmar</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
