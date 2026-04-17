import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight, Plus, Trash2, ImagePlus } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { exercises as builtinExercises, muscleGroups, equipmentList, getAllExercises } from '@/data/exercises';
import { useFavorites, useCustomExercises } from '@/hooks/useStorage';
import { MuscleGroup, Equipment, Exercise } from '@/types/workout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { haptic } from '@/lib/haptic';
import { getMuscleColor } from '@/lib/muscleColors';
import { toast } from 'sonner';
import ExerciseMedia from '@/components/ExerciseMedia';

const stagger = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.025, 0.3), duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Exercises() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { exercises: customExercises, addExercise: addCustom, removeExercise: removeCustom } = useCustomExercises();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('');
  const [equipFilter, setEquipFilter] = useState<Equipment | ''>('');
  const [showFavs, setShowFavs] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroup: 'Peito' as string,
    equipment: 'Barra' as string,
    description: '',
    instructions: '',
    image: '',
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  const allExercises = useMemo(() => getAllExercises(), [customExercises]);

  const filtered = useMemo(() => allExercises.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscleFilter && e.muscleGroup !== muscleFilter) return false;
    if (equipFilter && e.equipment !== equipFilter) return false;
    if (showFavs && !isFavorite(e.id)) return false;
    return true;
  }), [allExercises, search, muscleFilter, equipFilter, showFavs, isFavorite]);

  const grouped = useMemo(() => muscleFilter
    ? { [muscleFilter]: filtered }
    : filtered.reduce<Record<string, Exercise[]>>((acc, e) => {
        (acc[e.muscleGroup] = acc[e.muscleGroup] || []).push(e);
        return acc;
      }, {}), [filtered, muscleFilter]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setNewExercise(prev => ({ ...prev, image: ev.target?.result as string || '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!newExercise.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    addCustom({
      name: newExercise.name.trim(),
      muscleGroup: newExercise.muscleGroup,
      equipment: newExercise.equipment,
      description: newExercise.description.trim(),
      instructions: newExercise.instructions.split('\n').filter(l => l.trim()),
      image: newExercise.image || undefined,
    });
    setNewExercise({ name: '', muscleGroup: 'Peito', equipment: 'Barra', description: '', instructions: '', image: '' });
    setShowCreate(false);
    haptic('success');
    toast.success('Exercício criado!');
  };

  const isCustom = (id: string) => id.startsWith('custom-');

  return (
    <PageShell title="Exercícios" rightAction={
      <button onClick={() => setShowCreate(true)} className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary active:scale-95 transition-transform hover:bg-primary/25">
        <Plus size={22} />
      </button>
    }>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/80 font-bold text-sm transition-all"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setShowFavs(!showFavs)}
              className={`whitespace-nowrap shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${showFavs ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >
              <Heart size={12} fill={showFavs ? 'currentColor' : 'none'} /> Favoritos
            </button>
            <button
              onClick={() => setMuscleFilter('')}
              className={`whitespace-nowrap shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${!muscleFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >
              Todos
            </button>
            {muscleGroups.map(mg => {
              const color = getMuscleColor(mg);
              return (
                <button
                  key={mg}
                  onClick={() => setMuscleFilter(muscleFilter === mg ? '' : mg)}
                  className={`whitespace-nowrap shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${muscleFilter === mg ? `${color.bg} ${color.text} border ${color.border}` : 'bg-secondary text-muted-foreground'}`}
                >
                  {mg}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setEquipFilter('')}
              className={`whitespace-nowrap shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${!equipFilter ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card border border-border/40 text-muted-foreground'}`}
            >
              Todo Equipamento
            </button>
            {equipmentList.map(eq => (
              <button
                key={eq}
                onClick={() => setEquipFilter(equipFilter === eq ? '' : eq)}
                className={`whitespace-nowrap shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${equipFilter === eq ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card border border-border/40 text-muted-foreground'}`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground font-bold px-1 tracking-tight">{filtered.length} exercícios encontrados</p>

        {/* List */}
        <div className="space-y-6 pb-6">
        {Object.entries(grouped).map(([group, exs]) => {
          const color = getMuscleColor(group);
          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color.bg.replace('/15', '')} border ${color.border}`} style={{ background: `currentColor` }} />
                <h3 className={`text-xs font-black uppercase tracking-widest ${color.text}`}>{group}</h3>
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[10px] text-muted-foreground font-body">{exs.length}</span>
              </div>
              <div className="space-y-2.5">
                {exs.map((ex, i) => {
                  const c = getMuscleColor(ex.muscleGroup);
                  const customEx = customExercises.find(ce => ce.id === ex.id);
                  return (
                    <motion.div
                      key={ex.id}
                      custom={i}
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                    >
                      <div
                        className="w-full card-premium rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.97] transition-transform cursor-pointer"
                        onClick={() => navigate(`/exercicio/${ex.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && navigate(`/exercicio/${ex.id}`)}
                      >
                        <ExerciseMedia
                          exerciseId={ex.id}
                          exerciseName={ex.name}
                          muscleGroup={ex.muscleGroup}
                          customImage={customEx?.image}
                          size="sm"
                          placeholderLetter={isCustom(ex.id) ? '★' : ex.name.charAt(0)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-base truncate">{ex.name}</p>
                            {isCustom(ex.id) && (
                              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold shrink-0 tracking-widest">CUSTOM</span>
                            )}
                          </div>
                          <p className={`text-xs font-bold mt-1 tracking-wide ${c.text}`}>{ex.muscleGroup}</p>
                          <p className="text-[10px] text-muted-foreground font-body mt-0.5">{ex.equipment}</p>
                        </div>
                        {isCustom(ex.id) && (
                          <button
                            onClick={e => { e.stopPropagation(); removeCustom(ex.id); haptic('light'); toast.success('Exercício removido'); }}
                            className="p-2.5 shrink-0 active:scale-90 transition-transform rounded-lg hover:bg-destructive/10"
                          >
                            <Trash2 size={18} className="text-destructive" />
                          </button>
                        )}
                        <span
                          onClick={e => { e.stopPropagation(); toggleFavorite(ex.id); haptic('light'); }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavorite(ex.id); } }}
                          className="p-2.5 shrink-0 active:scale-90 transition-transform rounded-lg hover:bg-secondary"
                        >
                          <Heart size={20} className={`transition-colors ${isFavorite(ex.id) ? 'text-primary fill-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.5)]' : 'text-muted-foreground/40'}`} />
                        </span>
                        <ChevronRight size={20} className="text-muted-foreground/30 shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border/40 mx-auto flex items-center justify-center">
              <Search size={24} className="text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-body text-sm">Nenhum exercício encontrado</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs text-primary font-medium underline underline-offset-2"
            >
              Criar exercício personalizado
            </button>
          </div>
        )}
      </div>

      {/* Create custom exercise dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Exercício</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">

            {/* Image upload */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Foto do exercício (opcional)</label>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {newExercise.image ? (
                <div className="relative">
                  <img src={newExercise.image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => setNewExercise(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <ImagePlus size={20} />
                  <span className="text-xs font-body">Toque para adicionar foto</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Nome *</label>
              <input
                type="text"
                placeholder="Ex: Rosca com Halteres Alternada"
                value={newExercise.name}
                onChange={e => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Grupo Muscular</label>
              <div className="flex flex-wrap gap-1.5">
                {muscleGroups.map(mg => {
                  const c = getMuscleColor(mg);
                  return (
                    <button
                      key={mg}
                      onClick={() => setNewExercise(prev => ({ ...prev, muscleGroup: mg }))}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${newExercise.muscleGroup === mg ? `${c.bg} ${c.text} ${c.border}` : 'bg-secondary text-muted-foreground border-transparent'}`}
                    >
                      {mg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Equipamento</label>
              <div className="flex flex-wrap gap-1.5">
                {equipmentList.map(eq => (
                  <button
                    key={eq}
                    onClick={() => setNewExercise(prev => ({ ...prev, equipment: eq }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${newExercise.equipment === eq ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Descrição (opcional)</label>
              <input
                type="text"
                placeholder="Breve descrição do exercício"
                value={newExercise.description}
                onChange={e => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Instruções (uma por linha, opcional)</label>
              <textarea
                placeholder="Posicione-se...&#10;Realize o movimento...&#10;Retorne..."
                value={newExercise.instructions}
                onChange={e => setNewExercise(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring font-body min-h-[80px] resize-none"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!newExercise.name.trim()}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50"
            >
              Criar Exercício
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
