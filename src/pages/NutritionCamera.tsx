import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Pencil, Save, Trash2, Loader2, UtensilsCrossed, WifiOff, CheckCircle2, Plus, Search, ChevronRight, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { apiFetch } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { useNetwork } from '@/hooks/useNetwork';
import { useMeals } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { NutritionItem, MealEntry } from '@/types/nutrition';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, calcMacrosForGrams, FoodItem } from '@/data/foodDatabase';

const MEAL_TYPES = [
  { value: 'cafe', label: '☕ Café da Manhã' },
  { value: 'almoco', label: '🍽️ Almoço' },
  { value: 'lanche', label: '🥪 Lanche' },
  { value: 'jantar', label: '🌙 Jantar' },
  { value: 'outro', label: '🍴 Outro' },
] as const;

async function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1024;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      let quality = 0.85;
      let result = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      while (result.length * 0.75 > 800 * 1024 && quality > 0.3) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      }
      resolve(result);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

function recalcTotals(items: NutritionItem[]) {
  return {
    calories: Math.round(items.reduce((s, i) => s + (i.calories || 0), 0)),
    protein: Math.round(items.reduce((s, i) => s + (i.protein || 0), 0) * 10) / 10,
    carbs: Math.round(items.reduce((s, i) => s + (i.carbs || 0), 0) * 10) / 10,
    fat: Math.round(items.reduce((s, i) => s + (i.fat || 0), 0) * 10) / 10,
    fiber: Math.round(items.reduce((s, i) => s + (i.fiber || 0), 0) * 10) / 10,
  };
}

export default function NutritionCamera() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addMeal } = useMeals();
  const { isOnline } = useNetwork();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'food' | 'ai'>('food');
  const [items, setItems] = useState<NutritionItem[]>([]);
  const [mealType, setMealType] = useState<MealEntry['type']>('almoco');
  const [showSaved, setShowSaved] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);

  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState('100');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const filteredFoods = searchFoods(foodSearch, foodCategory || undefined);
  const totals = recalcTotals(items);

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

  const processImage = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 20MB.', variant: 'destructive' }); return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      const compressed = await compressImage(result.split(',')[1]);
      setImageBase64(compressed);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = '';
  };

  const analyzeWithAI = async () => {
    if (!imageBase64 && !description.trim()) {
      toast({ title: 'Adicione uma foto ou descreva a refeição', variant: 'destructive' }); return;
    }
    if (!isOnline) {
      toast({ title: 'Sem conexão', description: 'Análise de IA precisa de internet.', variant: 'destructive' }); return;
    }
    setIsAnalyzing(true);
    haptic('light');
    try {
      const response = await apiFetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, description: description.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
      if (!data?.items || !Array.isArray(data.items)) throw new Error('Resposta inválida da IA.');
      setItems(prev => [...prev, ...data.items]);
      setImagePreview(null);
      setImageBase64(null);
      setDescription('');
      setTab('food');
      haptic('success');
      toast({ title: `${data.items.length} alimentos identificados pela IA`, description: 'Confira e ajuste se necessário.' });
    } catch (e) {
      haptic('error');
      toast({ title: 'Erro na análise', description: e instanceof Error ? e.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
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

  const preview = selectedFood && portionGrams
    ? calcMacrosForGrams(selectedFood, parseFloat(portionGrams) || 100)
    : null;

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-4 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center active:scale-95 transition-transform shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">Registrar Refeição</h1>
            <p className="text-xs text-muted-foreground font-body truncate">Selecione alimentos ou use a IA</p>
          </div>
        </div>

        {/* Saved overlay */}
        <AnimatePresence>
          {showSaved && (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="bg-card border border-primary/30 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
                <CheckCircle2 size={48} className="text-primary mx-auto" />
                <p className="text-xl font-bold">Refeição salva!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 bg-secondary rounded-xl p-1">
          <button onClick={() => setTab('food')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'food' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            🥗 Base de Alimentos
          </button>
          <button onClick={() => setTab('ai')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'ai' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Bot size={14} /> Análise IA
          </button>
        </div>

        {/* ====== TAB: FOOD DATABASE ====== */}
        {tab === 'food' && (
          <div className="space-y-4">

            {/* Food search */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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

            {/* Food list */}
            {!selectedFood && (
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {filteredFoods.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8 font-body">Nenhum alimento encontrado</p>
                ) : (
                  filteredFoods.map(food => (
                    <button
                      key={food.id}
                      onClick={() => { setSelectedFood(food); setPortionGrams('100'); haptic('light'); }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-secondary active:scale-[0.98] transition-all text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{food.name}</p>
                        <p className="text-xs text-muted-foreground font-body">{food.per100g.calories} kcal · P {food.per100g.protein}g · C {food.per100g.carbs}g · G {food.per100g.fat}g <span className="opacity-50">(por 100g)</span></p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Food selected → portion input */}
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

                  {/* Gram input */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Quantidade (gramas)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={portionGrams}
                        onChange={e => setPortionGrams(e.target.value)}
                        className="flex-1 bg-secondary rounded-xl px-4 py-3 text-center text-lg font-black outline-none focus:ring-2 focus:ring-ring"
                        placeholder="100"
                      />
                    </div>
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

                  {/* Preview macros */}
                  {preview && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Calorias', value: preview.calories, unit: 'kcal', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                        { label: 'Proteína', value: preview.protein, unit: 'g', color: 'text-red-400', bg: 'bg-red-400/10' },
                        { label: 'Carbos', value: preview.carbs, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Gordura', value: preview.fat, unit: 'g', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                      ].map(m => (
                        <div key={m.label} className={`${m.bg} rounded-xl p-2.5 text-center`}>
                          <p className={`text-base font-black ${m.color}`}>{m.value}</p>
                          <p className="text-[9px] text-muted-foreground font-body">{m.unit}</p>
                          <p className="text-[9px] text-muted-foreground font-body">{m.label}</p>
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
          </div>
        )}

        {/* ====== TAB: AI ====== */}
        {tab === 'ai' && (
          <div className="space-y-4">
            {!isOnline && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2.5">
                <WifiOff size={14} className="text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-300 font-body">Sem internet — análise de IA indisponível.</p>
              </div>
            )}

            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Refeição" className="w-full aspect-[4/3] object-cover rounded-2xl" />
                <button onClick={() => { setImagePreview(null); setImageBase64(null); }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { haptic('light'); cameraInputRef.current?.click(); }}
                  className="bg-primary text-primary-foreground rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-[0.97] transition-transform shadow-lg shadow-primary/20">
                  <Camera size={26} />
                  <span className="font-semibold text-sm">Tirar Foto</span>
                </button>
                <button onClick={() => { haptic('light'); fileInputRef.current?.click(); }}
                  className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-[0.97] transition-transform">
                  <Upload size={26} className="text-muted-foreground" />
                  <span className="font-semibold text-sm">Galeria</span>
                </button>
              </div>
            )}

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground px-1">Ou descreva a refeição</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: 200g arroz, 150g frango grelhado, salada verde..."
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm min-h-[80px] resize-none"
              />
            </div>

            <button
              onClick={analyzeWithAI}
              disabled={isAnalyzing || (!imageBase64 && !description.trim()) || !isOnline}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {isAnalyzing ? (
                <><Loader2 size={20} className="animate-spin" /> Analisando com IA...</>
              ) : (
                <><UtensilsCrossed size={20} /> Analisar com IA</>
              )}
            </button>
            <p className="text-center text-xs text-muted-foreground font-body">Os alimentos serão adicionados à lista abaixo</p>
          </div>
        )}

        {/* ====== ITEMS ADDED ====== */}
        {items.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Alimentos adicionados ({items.length})</h3>
              </div>

              {/* Running totals */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Calorias', value: totals.calories, unit: 'kcal', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                  { label: 'Proteína', value: totals.protein, unit: 'g', color: 'text-red-400', bg: 'bg-red-400/10' },
                  { label: 'Carbos', value: totals.carbs, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Gordura', value: totals.fat, unit: 'g', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                ].map(m => (
                  <div key={m.label} className={`${m.bg} rounded-xl p-2.5 text-center`}>
                    <p className={`text-base font-black ${m.color}`}>{m.value}</p>
                    <p className="text-[9px] text-muted-foreground font-body">{m.unit}</p>
                    <p className="text-[9px] text-muted-foreground font-body">{m.label}</p>
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
                        <p className="text-xs text-muted-foreground font-body">{item.portion} · <span className="text-orange-400">{item.calories} kcal</span> · P {item.protein}g · C {item.carbs}g · G {item.fat}g</p>
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

            {/* Save */}
            <button onClick={saveMeal}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
              <Save size={18} /> Salvar Refeição
            </button>
          </motion.div>
        )}

        {/* Empty state when no items */}
        {items.length === 0 && tab === 'food' && !selectedFood && (
          <div className="text-center py-8 text-muted-foreground">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-body">Busque e adicione alimentos acima</p>
            <p className="text-xs font-body mt-1 opacity-60">ou use a aba IA para análise por foto</p>
          </div>
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Alimento</DialogTitle></DialogHeader>
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
