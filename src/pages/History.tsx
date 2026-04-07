import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Dumbbell, TrendingUp, MessageSquare } from 'lucide-react';
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
  const sorted = [...history].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, w) => {
    const key = new Date(w.completedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    (acc[key] = acc[key] || []).push(w);
    return acc;
  }, {});

  return (
    <PageShell title="Histórico">
      <div className="space-y-6 max-w-lg mx-auto">
        {Object.entries(grouped).map(([month, workouts]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest capitalize px-1">{month}</h2>
            <div className="space-y-2.5">
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
                    className="w-full bg-card rounded-2xl p-5 text-left active:scale-[0.97] transition-all border border-border/40 hover:border-primary/20 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{w.name}</h3>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {new Date(w.completedAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{w.totalVolume.toLocaleString()}kg</p>
                        <p className="text-[10px] text-muted-foreground font-body">volume</p>
                      </div>
                    </div>

                    {exerciseNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {exerciseNames.map((name, j) => (
                          <span key={j} className="text-[10px] bg-secondary/80 px-2.5 py-1 rounded-lg text-muted-foreground font-body">{name}</span>
                        ))}
                        {w.exercises.length > 3 && (
                          <span className="text-[10px] bg-secondary/80 px-2.5 py-1 rounded-lg text-muted-foreground font-body">+{w.exercises.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1.5"><Dumbbell size={12} /> {w.exercises.length} exercícios</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {Math.round(w.duration / 60)} min</span>
                      {w.notes && <span className="flex items-center gap-1"><MessageSquare size={12} /></span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border/40 mx-auto flex items-center justify-center">
              <Calendar size={36} className="text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">Nenhum treino registrado</p>
              <p className="text-xs text-muted-foreground/60 font-body">Complete seu primeiro treino para ver o histórico</p>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
