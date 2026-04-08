import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { exercises as builtinExercises, muscleGroups, equipmentList, getAllExercises } from '@/data/exercises';
import { useFavorites, useCustomExercises } from '@/hooks/useStorage';
import { MuscleGroup, Equipment, Exercise } from '@/types/workout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { haptic } from '@/lib/haptic';
import { toast } from 'sonner';

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
  });

  const allExercises = getAllExercises();

  const filtered = allExercises.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscleFilter && e.muscleGroup !== muscleFilter) return false;
    if (equipFilter && e.equipment !== equipFilter) return false;
    if (showFavs && !isFavorite(e.id)) return false;
    return true;
  });

  const grouped = muscleFilter
    ? { [muscleFilter]: filtered }
    : filtered.reduce<Record<string, Exercise[]>>((acc, e) => {
        (acc[e.muscleGroup] = acc[e.muscleGroup] || []).push(e);
        return acc;
      }, {});

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
    });
    setNewExercise({ name: '', muscleGroup: 'Peito', equipment: 'Barra', description: '', instructions: '' });
    setShowCreate(false);
    haptic('success');
    toast.success('Exercício criado!');
  };

  const isCustom = (id: string) => id.startsWith('custom-');

  return (
    <PageShell title="Exercícios" rightAction={
      <button onClick={() => setShowCreate(true)} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Plus size={20} />
      </button>
    }>
      <div className="space-y-4 max-w-lg mx-auto">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 font-body text-sm transition-all"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFavs(!showFavs)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${showFavs ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-card border border-border/40 text-muted-foreground'}`}
            >
              <Heart size={12} fill={showFavs ? 'currentColor' : 'none'} /> Favoritos
            </button>
            <button
              onClick={() => setMuscleFilter('')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${!muscleFilter ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-card border border-border/40 text-muted-foreground'}`}
            >
              Todos
            </button>
            {muscleGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(muscleFilter === mg ? '' : mg)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${muscleFilter === mg ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-card border border-border/40 text-muted-foreground'}`}
              >
                {mg}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {equipmentList.map(eq => (
              <button
                key={eq}
                onClick={() => setEquipFilter(equipFilter === eq ? '' : eq)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${equipFilter === eq ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-card border border-border/40 text-muted-foreground'}`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground font-body px-1">{filtered.length} exercícios encontrados</p>

        {/* List */}
        {Object.entries(grouped).map(([group, exs]) => (
          <div key={group} className="space-y-2.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{group}</h3>
            <div className="space-y-2">
              {exs.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  custom={i}
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                >
                  <div
                    className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.97] transition-all cursor-pointer border border-border/40 hover:border-primary/20"
                    onClick={() => navigate(`/exercicio/${ex.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/exercicio/${ex.id}`)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${isCustom(ex.id) ? 'bg-primary/15 text-primary' : 'bg-primary/8 text-primary'}`}>
                      {isCustom(ex.id) ? '★' : ex.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{ex.name}</p>
                        {isCustom(ex.id) && (
                          <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">CUSTOM</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">{ex.equipment}</p>
                    </div>
                    {isCustom(ex.id) && (
                      <button
                        onClick={e => { e.stopPropagation(); removeCustom(ex.id); haptic('light'); toast.success('Exercício removido'); }}
                        className="p-2 shrink-0 active:scale-90 transition-transform"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    )}
                    <span
                      onClick={e => { e.stopPropagation(); toggleFavorite(ex.id); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavorite(ex.id); } }}
                      className="p-2 shrink-0 active:scale-90 transition-transform"
                    >
                      <Heart size={16} className={`transition-colors ${isFavorite(ex.id) ? 'text-primary fill-primary' : 'text-muted-foreground/40'}`} />
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

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
                {muscleGroups.map(mg => (
                  <button
                    key={mg}
                    onClick={() => setNewExercise(prev => ({ ...prev, muscleGroup: mg }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${newExercise.muscleGroup === mg ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {mg}
                  </button>
                ))}
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
