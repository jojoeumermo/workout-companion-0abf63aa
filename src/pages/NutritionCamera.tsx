import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Pencil, Save, Trash2, Loader2, Info, UtensilsCrossed, AlertTriangle, WifiOff, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { apiFetch } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { useNetwork } from '@/hooks/useNetwork';
import { useMeals } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { NutritionItem, MealEntry } from '@/types/nutrition';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MEAL_TYPES = [
  { value: 'cafe', label: '☕ Café da Manhã' },
  { value: 'almoco', label: '🍽️ Almoço' },
  { value: 'lanche', label: '🥪 Lanche' },
  { value: 'jantar', label: '🌙 Jantar' },
  { value: 'outro', label: '🍴 Outro' },
] as const;

async function compressImage(base64: string, maxSizeKB = 800): Promise<string> {
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
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      let quality = 0.85;
      let result = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      while (result.length * 0.75 > maxSizeKB * 1024 && quality > 0.3) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      }
      resolve(result);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

export default function NutritionCamera() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addMeal } = useMeals();
  const { isOnline } = useNetwork();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<{
    items: NutritionItem[];
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber?: number };
    confidence?: string;
    tips?: string;
  } | null>(null);
  const [mealType, setMealType] = useState<MealEntry['type']>('almoco');
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 });

  const processImage = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 20MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      const rawBase64 = result.split(',')[1];
      const compressed = await compressImage(rawBase64);
      setImageBase64(compressed);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = '';
  };

  const analyzeImage = async () => {
    if (!imageBase64 && !description.trim()) {
      toast({ title: 'Adicione uma foto ou descreva a refeição', variant: 'destructive' });
      return;
    }
    if (!isOnline) {
      toast({ title: 'Sem conexão', description: 'A análise de IA precisa de internet. Você pode adicionar alimentos manualmente.', variant: 'destructive' });
      return;
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
      if (data?.error) throw new Error(data.error);
      if (!data?.items || !Array.isArray(data.items)) throw new Error('Resposta inválida da IA. Tente novamente.');

      setAnalysisResult(data);
      haptic('success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao analisar refeição';
      haptic('error');
      toast({ title: 'Erro na análise', description: msg, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recalcTotals = (items: NutritionItem[]) => ({
    calories: Math.round(items.reduce((s, i) => s + (i.calories || 0), 0)),
    protein: Math.round(items.reduce((s, i) => s + (i.protein || 0), 0) * 10) / 10,
    carbs: Math.round(items.reduce((s, i) => s + (i.carbs || 0), 0) * 10) / 10,
    fat: Math.round(items.reduce((s, i) => s + (i.fat || 0), 0) * 10) / 10,
    fiber: Math.round(items.reduce((s, i) => s + (i.fiber || 0), 0) * 10) / 10,
  });

  const updateItem = (index: number, field: keyof NutritionItem, value: any) => {
    if (!analysisResult) return;
    const items = [...analysisResult.items];
    items[index] = { ...items[index], [field]: value };
    setAnalysisResult({ ...analysisResult, items, totals: recalcTotals(items) });
  };

  const removeItem = (index: number) => {
    if (!analysisResult) return;
    const items = analysisResult.items.filter((_, i) => i !== index);
    setAnalysisResult({ ...analysisResult, items, totals: recalcTotals(items) });
  };

  const addManualItem = () => {
    const item: NutritionItem = { ...manualItem, fiber: 0 };
    if (!item.name) return;
    if (analysisResult) {
      const items = [...analysisResult.items, item];
      setAnalysisResult({ ...analysisResult, items, totals: recalcTotals(items) });
    } else {
      setAnalysisResult({
        items: [item],
        totals: recalcTotals([item]),
        confidence: 'manual',
      });
    }
    setManualItem({ name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    setAddingManual(false);
    haptic('light');
  };

  const saveMeal = () => {
    if (!analysisResult) return;
    const now = new Date();
    addMeal({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      type: mealType,
      items: analysisResult.items,
      totals: analysisResult.totals,
      notes: description || undefined,
      confidence: analysisResult.confidence as any,
    });
    haptic('success');
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); navigate('/nutricao'); }, 1500);
  };

  const reset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setDescription('');
    setAnalysisResult(null);
    setEditingItem(null);
  };

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Câmera Nutri</h1>
            <p className="text-xs text-muted-foreground font-body">Foto ou descrição → macros estimados</p>
          </div>
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2.5">
            <WifiOff size={14} className="text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-300 font-body">Sem internet — análise de IA indisponível. Adicione alimentos manualmente.</p>
          </div>
        )}

        {/* Privacy */}
        {isOnline && (
          <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300 font-body">A imagem é enviada somente para análise. Nenhuma foto é armazenada.</p>
          </div>
        )}

        {/* Saved overlay */}
        <AnimatePresence>
          {showSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="bg-card border border-primary/30 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
                <CheckCircle2 size={48} className="text-primary mx-auto" />
                <p className="text-xl font-bold">Refeição salva!</p>
                <p className="text-sm text-muted-foreground font-body">{mealType === 'cafe' ? 'Café da manhã' : mealType === 'almoco' ? 'Almoço' : mealType === 'lanche' ? 'Lanche' : mealType === 'jantar' ? 'Jantar' : 'Refeição'} registrado</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!analysisResult ? (
          <>
            {/* Image capture */}
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Refeição" className="w-full aspect-[4/3] object-cover rounded-2xl" />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                    <p className="text-xs text-white font-medium">Foto selecionada</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { haptic('light'); cameraInputRef.current?.click(); }}
                    className="bg-primary text-primary-foreground rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-[0.97] transition-transform shadow-lg shadow-primary/20"
                  >
                    <Camera size={28} />
                    <span className="font-semibold text-sm">Tirar Foto</span>
                  </button>
                  <button
                    onClick={() => { haptic('light'); fileInputRef.current?.click(); }}
                    className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-[0.97] transition-transform"
                  >
                    <Upload size={28} className="text-muted-foreground" />
                    <span className="font-semibold text-sm">Galeria</span>
                  </button>
                </div>
              )}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Text description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground px-1">Ou descreva a refeição</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: 200g arroz branco, 150g frango grelhado, salada verde..."
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm min-h-[80px] resize-none"
              />
            </div>

            {/* Meal type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground px-1">Tipo de refeição</label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setMealType(t.value); haptic('light'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                      mealType === t.value ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-card border border-border text-muted-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing || (!imageBase64 && !description.trim()) || !isOnline}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <UtensilsCrossed size={20} />
                  Analisar Refeição
                </>
              )}
            </button>

            {/* Manual add fallback */}
            <button
              onClick={() => { setAddingManual(true); haptic('light'); }}
              className="w-full border border-dashed border-border rounded-xl py-3 text-xs text-muted-foreground font-body flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
            >
              <Plus size={14} /> Adicionar alimento manualmente
            </button>
          </>
        ) : (
          /* Results */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Confidence badge */}
            {analysisResult.confidence && analysisResult.confidence !== 'manual' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                analysisResult.confidence === 'alta' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                analysisResult.confidence === 'media' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <AlertTriangle size={13} />
                Confiança {analysisResult.confidence} na estimativa — você pode editar os valores
              </div>
            )}

            {/* Macro cards */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Calorias', value: Math.round(analysisResult.totals.calories), unit: 'kcal', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                { label: 'Proteína', value: analysisResult.totals.protein, unit: 'g', color: 'text-red-400', bg: 'bg-red-400/10' },
                { label: 'Carbos', value: analysisResult.totals.carbs, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Gordura', value: analysisResult.totals.fat, unit: 'g', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              ].map(m => (
                <div key={m.label} className={`${m.bg} rounded-2xl p-3 text-center space-y-0.5`}>
                  <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[9px] text-muted-foreground font-body">{m.unit}</p>
                  <p className="text-[9px] text-muted-foreground font-body">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Food items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-sm">Alimentos identificados</h3>
                <button
                  onClick={() => { setAddingManual(true); haptic('light'); }}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>
              <AnimatePresence>
                {analysisResult.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-card rounded-xl border border-border/40 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-body">{item.portion}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingItem(i); haptic('light'); }} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => { removeItem(i); haptic('light'); }} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-destructive active:scale-90 transition-transform">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[11px] text-muted-foreground font-body">
                      <span className="text-orange-400 font-medium">{item.calories} kcal</span>
                      <span>P {item.protein}g</span>
                      <span>C {item.carbs}g</span>
                      <span>G {item.fat}g</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Tips */}
            {analysisResult.tips && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs text-primary font-body">💡 {analysisResult.tips}</p>
              </div>
            )}

            {/* Meal type selector in results too */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground px-1">Tipo de refeição</label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setMealType(t.value); haptic('light'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      mealType === t.value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { reset(); haptic('light'); }} className="bg-card border border-border rounded-xl py-3 font-medium text-sm active:scale-[0.97] transition-transform">
                Nova Análise
              </button>
              <button
                onClick={saveMeal}
                className="bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-primary/20"
              >
                <Save size={16} /> Salvar Refeição
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar Alimento</DialogTitle>
          </DialogHeader>
          {editingItem !== null && analysisResult && (
            <div className="space-y-3 mt-2">
              {[
                { label: 'Nome', field: 'name', type: 'text' },
                { label: 'Porção', field: 'portion', type: 'text' },
                { label: 'Calorias (kcal)', field: 'calories', type: 'number' },
                { label: 'Proteína (g)', field: 'protein', type: 'number' },
                { label: 'Carboidratos (g)', field: 'carbs', type: 'number' },
                { label: 'Gordura (g)', field: 'fat', type: 'number' },
              ].map(({ label, field, type }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted-foreground font-body">{label}</label>
                  <input
                    type={type}
                    inputMode={type === 'number' ? 'decimal' : undefined}
                    value={(analysisResult.items[editingItem] as any)[field]}
                    onChange={e => updateItem(editingItem, field as keyof NutritionItem, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); haptic('light'); }} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm">
                Confirmar
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Manual Item Dialog */}
      <Dialog open={addingManual} onOpenChange={setAddingManual}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { label: 'Nome do alimento *', field: 'name', type: 'text', placeholder: 'Ex: Frango grelhado' },
              { label: 'Porção', field: 'portion', type: 'text', placeholder: 'Ex: 150g' },
              { label: 'Calorias (kcal)', field: 'calories', type: 'number', placeholder: '0' },
              { label: 'Proteína (g)', field: 'protein', type: 'number', placeholder: '0' },
              { label: 'Carboidratos (g)', field: 'carbs', type: 'number', placeholder: '0' },
              { label: 'Gordura (g)', field: 'fat', type: 'number', placeholder: '0' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">{label}</label>
                <input
                  type={type}
                  inputMode={type === 'number' ? 'decimal' : undefined}
                  placeholder={placeholder}
                  value={(manualItem as any)[field] || ''}
                  onChange={e => setManualItem(prev => ({ ...prev, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
            <button
              onClick={addManualItem}
              disabled={!manualItem.name.trim()}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
