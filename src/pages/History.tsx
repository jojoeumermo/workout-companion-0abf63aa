import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Dumbbell, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';

const stagger = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function History() {
  const navigate = useNavigate();
  const [history] = useHistory();
  const sorted = useMemo(() =>
    [...history].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [history]);

  const grouped = useMemo(() =>
    sorted.reduce<Record<string, typeof sorted>>((acc, w) => {
      const key = new Date(w.completedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      (acc[key] = acc[key] || []).push(w);
      return acc;
    }, {}),
    [sorted]);

  return (
    <PageShell title="Histórico">
      <div className="space-y-8 max-w-lg mx-auto pt-2">
        {Object.entries(grouped).map(([month, workouts]) => (
          <div key={month} className="space-y-4">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest capitalize px-1">{month}</h2>
            <div className="space-y-4">
              {workouts.map((w, i) => {
                const exerciseNames = w.exercises
                  .slice(0, 3)
                  .map(e => getExerciseById(e.exerciseId)?.name)
                  .filter(Boolean);

                return (
                  <motion.button
                    key={w.id}
                    custom={i}
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    onClick={() => navigate(`/historico/${w.id}`)}
                    className="w-full card-premium rounded-2xl p-6 text-left active:scale-[0.97] transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black text-xl tracking-tight leading-tight">{w.name}</h3>
                        <p className="text-sm text-muted-foreground font-bold mt-1">
                          {new Date(w.completedAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xl font-black text-primary leading-none">{w.totalVolume.toLocaleString()}kg</p>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">volume</p>
                      </div>
                    </div>

                    {exerciseNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exerciseNames.map((name, j) => (
                          <span key={j} className="text-[10px] bg-secondary px-3 py-1.5 rounded-lg text-secondary-foreground font-bold tracking-wide">{name}</span>
                        ))}
                        {w.exercises.length > 3 && (
                          <span className="text-[10px] bg-secondary px-3 py-1.5 rounded-lg text-secondary-foreground font-bold tracking-wide">+{w.exercises.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold pt-1">
                      <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-md"><Dumbbell size={14} /> {w.exercises.length} exercícios</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {Math.round(w.duration / 60)} min</span>
                      {w.notes && <span className="flex items-center gap-1 ml-auto text-primary"><MessageSquare size={14} /></span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 space-y-5">
            <div className="w-24 h-24 rounded-3xl bg-secondary mx-auto flex items-center justify-center shadow-inner">
              <Calendar size={40} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-xl font-bold">Nenhum treino registrado</p>
              <p className="text-sm text-muted-foreground font-body mt-1">Complete seu primeiro treino para ver o histórico</p>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
