import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { exercises, muscleGroups, equipmentList, getExercisesByMuscle } from '@/data/exercises';
import { useFavorites } from '@/hooks/useStorage';
import { MuscleGroup, Equipment, Exercise } from '@/types/workout';

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

  // Group by muscle
  const grouped = muscleFilter
    ? { [muscleFilter]: filtered }
    : filtered.reduce<Record<string, Exercise[]>>((acc, e) => {
        (acc[e.muscleGroup] = acc[e.muscleGroup] || []).push(e);
        return acc;
      }, {});

  return (
    <PageShell title="Exercícios">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card rounded-2xl pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary font-body text-sm"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setShowFavs(!showFavs)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${showFavs ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
            >
              <Heart size={12} fill={showFavs ? 'currentColor' : 'none'} /> Favoritos
            </button>
            <button
              onClick={() => setMuscleFilter('')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!muscleFilter ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
            >
              Todos
            </button>
            {muscleGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(muscleFilter === mg ? '' : mg)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${muscleFilter === mg ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
              >
                {mg}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {equipmentList.map(eq => (
              <button
                key={eq}
                onClick={() => setEquipFilter(equipFilter === eq ? '' : eq)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${equipFilter === eq ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        {Object.entries(grouped).map(([group, exs]) => (
          <div key={group} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group}</h3>
            <div className="space-y-2">
              {exs.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <button
                    onClick={() => navigate(`/exercicio/${ex.id}`)}
                    className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary text-lg font-bold">
                      {ex.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ex.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{ex.equipment}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(ex.id); }}
                      className="p-2"
                    >
                      <Heart size={16} className={isFavorite(ex.id) ? 'text-primary fill-primary' : 'text-muted-foreground'} />
                    </button>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body">Nenhum exercício encontrado</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
