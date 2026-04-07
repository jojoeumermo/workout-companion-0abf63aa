import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { exercises, muscleGroups, equipmentList } from '@/data/exercises';
import { useFavorites } from '@/hooks/useStorage';
import { MuscleGroup, Equipment, Exercise } from '@/types/workout';

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
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('');
  const [equipFilter, setEquipFilter] = useState<Equipment | ''>('');
  const [showFavs, setShowFavs] = useState(false);

  const filtered = exercises.filter(e => {
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

  return (
    <PageShell title="Exercícios">
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
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-primary text-lg font-bold shrink-0">
                      {ex.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ex.name}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">{ex.equipment}</p>
                    </div>
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
          </div>
        )}
      </div>
    </PageShell>
  );
}
