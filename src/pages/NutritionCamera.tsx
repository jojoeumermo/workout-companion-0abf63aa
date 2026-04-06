import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Pencil, Save, Trash2, Loader2, Info, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { apiFetch } from '@/lib/api';
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

export default function NutritionCamera() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addMeal } = useMeals();
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

  const processImage = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 10MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Extract base64 without the data URL prefix
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const analyzeImage = async () => {
    if (!imageBase64 && !description.trim()) {
      toast({ title: 'Envie uma foto ou descreva a refeição', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await apiFetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, description: description.trim() || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao analisar');
      if (data?.error) throw new Error(data.error);

      setAnalysisResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao analisar refeição';
      toast({ title: 'Erro na análise', description: msg, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
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
      imageBase64: imageBase64 ? imageBase64.slice(0, 5000) : undefined, // small thumbnail
      notes: description || undefined,
      confidence: analysisResult.confidence as any,
    });
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      navigate('/nutricao');
    }, 1500);
  };

  const updateItem = (index: number, field: keyof NutritionItem, value: any) => {
    if (!analysisResult) return;
    const items = [...analysisResult.items];
    items[index] = { ...items[index], [field]: value };
    // Recalculate totals
    const totals = {
      calories: items.reduce((s, i) => s + i.calories, 0),
      protein: items.reduce((s, i) => s + i.protein, 0),
      carbs: items.reduce((s, i) => s + i.carbs, 0),
      fat: items.reduce((s, i) => s + i.fat, 0),
      fiber: items.reduce((s, i) => s + (i.fiber || 0), 0),
    };
    setAnalysisResult({ ...analysisResult, items, totals });
  };

  const removeItem = (index: number) => {
    if (!analysisResult) return;
    const items = analysisResult.items.filter((_, i) => i !== index);
    const totals = {
      calories: items.reduce((s, i) => s + i.calories, 0),
      protein: items.reduce((s, i) => s + i.protein, 0),
      carbs: items.reduce((s, i) => s + i.carbs, 0),
      fat: items.reduce((s, i) => s + i.fat, 0),
      fiber: items.reduce((s, i) => s + (i.fiber || 0), 0),
    };
    setAnalysisResult({ ...analysisResult, items, totals });
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
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Nutrição com IA</h1>
            <p className="text-xs text-muted-foreground font-body">Tire uma foto ou descreva sua refeição</p>
          </div>
        </div>

        {/* Privacy */}
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
          <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300 font-body leading-relaxed">
            A imagem é enviada apenas para análise nutricional. Nenhuma foto é armazenada sem sua confirmação.
          </p>
        </div>

        {/* Saved animation */}
        <AnimatePresence>
          {showSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
            >
              <div className="bg-primary text-primary-foreground rounded-3xl p-8 text-center space-y-3">
                <span className="text-5xl">✅</span>
                <p className="text-xl font-bold">Refeição salva!</p>
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
                    className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-primary text-primary-foreground rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
                  >
                    <Camera size={28} />
                    <span className="font-semibold text-sm">Tirar Foto</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
                  >
                    <Upload size={28} className="text-muted-foreground" />
                    <span className="font-semibold text-sm">Enviar Foto</span>
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
                placeholder="Ex: arroz, feijão, frango grelhado e salada..."
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
                    onClick={() => setMealType(t.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      mealType === t.value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
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
              disabled={isAnalyzing || (!imageBase64 && !description.trim())}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <UtensilsCrossed size={20} />
                  Analisar Refeição
                </>
              )}
            </button>
          </>
        ) : (
          /* Results */
          <div className="space-y-4">
            {/* Confidence */}
            {analysisResult.confidence && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                analysisResult.confidence === 'alta' ? 'bg-green-500/10 text-green-400' :
                analysisResult.confidence === 'media' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                <AlertTriangle size={14} />
                Confiança {analysisResult.confidence} na estimativa
              </div>
            )}

            {/* Macro summary */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Calorias', value: `${analysisResult.totals.calories}`, unit: 'kcal', color: 'text-orange-400' },
                { label: 'Proteína', value: `${analysisResult.totals.protein}`, unit: 'g', color: 'text-red-400' },
                { label: 'Carbos', value: `${analysisResult.totals.carbs}`, unit: 'g', color: 'text-blue-400' },
                { label: 'Gordura', value: `${analysisResult.totals.fat}`, unit: 'g', color: 'text-yellow-400' },
              ].map(m => (
                <div key={m.label} className="bg-card rounded-xl p-3 text-center space-y-1">
                  <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{m.unit}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm px-1">Alimentos identificados</h3>
              {analysisResult.items.map((item, i) => (
                <div key={i} className="bg-card rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{item.portion}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem(i)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => removeItem(i)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-destructive">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground font-body">
                    <span>{item.calories} kcal</span>
                    <span>P: {item.protein}g</span>
                    <span>C: {item.carbs}g</span>
                    <span>G: {item.fat}g</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            {analysisResult.tips && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs text-primary font-body">💡 {analysisResult.tips}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={reset} className="bg-card border border-border rounded-xl py-3 font-medium text-sm active:scale-[0.98] transition-transform">
                Nova Análise
              </button>
              <button
                onClick={saveMeal}
                className="bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
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
                    value={(analysisResult.items[editingItem] as any)[field]}
                    onChange={e => updateItem(editingItem, field as keyof NutritionItem, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <button onClick={() => setEditingItem(null)} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm mt-2">
                Confirmar
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
