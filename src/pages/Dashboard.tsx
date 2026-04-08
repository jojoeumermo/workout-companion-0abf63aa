import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Dumbbell, TrendingUp, Flame, Zap, Target, ChevronRight, Bot, BookOpen, Settings, UtensilsCrossed, Camera, Scale, Droplets, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory, useTemplates, useActiveWorkout, useGoals, useTheme, useMeals, useNutritionGoals, useBodyWeight, useWaterLog } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { ActiveWorkout } from '@/types/workout';

const themes: Record<string, string> = {
  green: '130 60% 50%',
  blue: '210 80% 55%',
  orange: '25 90% 55%',
  purple: '270 70% 60%',
  red: '0 75% 55%',
  cyan: '180 70% 45%',
  pink: '330 75% 60%',
  amber: '40 90% 50%',
  teal: '160 60% 45%',
};

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [history] = useHistory();
  const [templates] = useTemplates();
  const [, setActiveWorkout] = useActiveWorkout();
  const { goals } = useGoals();
  const [theme] = useTheme();
  const { meals } = useMeals();
  const [nutritionGoals] = useNutritionGoals();
  const { latest: latestWeight } = useBodyWeight();
  const { getTodayWater } = useWaterLog();

  useEffect(() => {
    if (theme && themes[theme]) {
      document.documentElement.style.setProperty('--primary', themes[theme]);
      document.documentElement.style.setProperty('--accent', themes[theme]);
      document.documentElement.style.setProperty('--ring', themes[theme]);
    }
  }, [theme]);

  const thisWeek = history.filter(w => {
    const d = new Date(w.completedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const weekVolume = thisWeek.reduce((sum, w) => sum + w.totalVolume, 0);
  const weekCount = thisWeek.length;

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.date === today);
  const todayCalories = todayMeals.reduce((s, m) => s + m.totals.calories, 0);

  const recentWorkouts = history.slice(-3).reverse();

  const startFreeWorkout = () => {
    const active: ActiveWorkout = {
      name: 'Treino Livre',
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      exercises: [],
    };
    setActiveWorkout(active);
    navigate('/treino-ativo');
  };

  const weeklyGoal = goals.find(g => g.type === 'weekly_frequency');
  const goalProgress = weeklyGoal ? Math.min(weekCount / weeklyGoal.target, 1) : null;

  const avgDuration = history.length > 0
    ? Math.round(history.reduce((s, w) => s + w.duration, 0) / history.length / 60)
    : 0;

  return (
    <PageShell>
      <div className="pt-16 space-y-5 max-w-lg mx-auto pb-6">
        {/* Header */}
        <motion.div custom={0} variants={stagger} initial="hidden" animate="show" className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-muted-foreground font-body text-sm tracking-wide">Pronto para treinar?</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/configuracoes')}
            className="w-11 h-11 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 hover:border-primary/20"
          >
            <Settings size={20} />
          </button>
        </motion.div>

        {/* Primary CTA */}
        <motion.div custom={1} variants={stagger} initial="hidden" animate="show" className="space-y-3">
          <button
            onClick={() => navigate('/treinos')}
            className="w-full relative overflow-hidden rounded-2xl p-5 flex items-center justify-between active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
              boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.4)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="text-left relative z-10">
              <span className="text-lg font-bold block text-primary-foreground">Iniciar Treino</span>
              <span className="text-sm opacity-80 font-body text-primary-foreground">
                {templates.length > 0 ? `${templates.length} rotinas salvas` : 'Crie sua primeira rotina'}
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center relative z-10">
              <Play size={28} fill="currentColor" className="text-primary-foreground" />
            </div>
          </button>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: Zap, label: 'Treino Livre', action: startFreeWorkout },
              { icon: BookOpen, label: 'Programas', action: () => navigate('/programas') },
              { icon: Camera, label: 'Câmera Nutri', action: () => navigate('/nutricao/camera') },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="card-premium rounded-2xl p-3.5 flex flex-col items-center gap-2.5 active:scale-[0.96] transition-all hover:border-primary/25 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon size={18} className="text-primary" />
                </div>
                <span className="font-semibold text-[11px] text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Today's summary strip */}
        <motion.div custom={2} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-2.5">
          {[
            { icon: UtensilsCrossed, value: Math.round(todayCalories).toString(), sub: 'kcal hoje', color: 'text-orange-400', bg: 'bg-orange-500/10', route: '/nutricao' },
            { icon: Droplets, value: `${((getTodayWater()) / 1000).toFixed(1).replace('.', ',')}L`, sub: 'água hoje', color: 'text-blue-400', bg: 'bg-blue-500/10', route: '/nutricao' },
            { icon: Scale, value: latestWeight ? `${latestWeight.weight}` : '--', sub: latestWeight ? 'kg peso' : 'registrar', color: 'text-primary', bg: 'bg-primary/10', route: '/peso' },
          ].map(({ icon: Icon, value, sub, color, bg, route }) => (
            <button
              key={sub}
              onClick={() => navigate(route)}
              className="card-premium rounded-2xl p-3.5 text-left active:scale-[0.96] transition-all hover:border-primary/20"
            >
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-2.5`}>
                <Icon size={15} className={color} />
              </div>
              <p className="text-xl font-extrabold leading-none tracking-tight">{value}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-1">{sub}</p>
            </button>
          ))}
        </motion.div>

        {/* Weekly Goal */}
        {goalProgress !== null && weeklyGoal && (
          <motion.div custom={3} variants={stagger} initial="hidden" animate="show" className="card-premium rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target size={16} className="text-primary" />
                </div>
                <div>
                  <span className="font-semibold text-sm block">Meta Semanal</span>
                  <span className="text-[10px] text-muted-foreground font-body">
                    {goalProgress >= 1 ? '🎉 Meta atingida!' : `${weeklyGoal.target - weekCount} treinos restantes`}
                  </span>
                </div>
              </div>
              <span className="text-lg font-extrabold text-primary">{weekCount}/{weeklyGoal.target}</span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress * 100}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div custom={4} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          <div className="card-premium rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Flame size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground font-body uppercase tracking-wider">Semana</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight">{weekCount}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">treinos realizados</p>
            </div>
          </div>
          <div className="card-premium rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground font-body uppercase tracking-wider">Volume</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight">{weekVolume > 1000 ? `${(weekVolume / 1000).toFixed(1)}t` : `${weekVolume}kg`}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">volume semanal</p>
            </div>
          </div>
        </motion.div>

        {/* AI Coach */}
        <motion.button
          custom={5}
          variants={stagger}
          initial="hidden"
          animate="show"
          onClick={() => navigate('/ai-coach')}
          className="w-full card-premium rounded-2xl p-4 flex items-center justify-between active:scale-[0.97] transition-all hover:border-primary/20 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Bot size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <span className="font-bold text-sm block">FitAI Coach</span>
              <span className="text-[11px] text-muted-foreground font-body">Pergunte sobre treino ou nutrição</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.button>

        {/* Recent */}
        {recentWorkouts.length > 0 && (
          <motion.div custom={6} variants={stagger} initial="hidden" animate="show" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Últimos Treinos</h2>
              <button onClick={() => navigate('/historico')} className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2.5">
              {recentWorkouts.map((w, i) => (
                <motion.button
                  key={w.id}
                  custom={7 + i}
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  onClick={() => navigate(`/historico/${w.id}`)}
                  className="w-full card-premium rounded-2xl p-4 text-left active:scale-[0.97] transition-all hover:border-primary/20"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-bold text-[15px]">{w.name}</span>
                    <span className="text-xs text-muted-foreground font-body bg-secondary px-2 py-0.5 rounded-md">
                      {new Date(w.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-body">
                    <span className="flex items-center gap-1.5"><Dumbbell size={12} /> {w.exercises.length} exercícios</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {Math.round(w.duration / 60)} min</span>
                    <span className="text-primary font-semibold ml-auto">{w.totalVolume.toLocaleString()}kg</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {history.length === 0 && todayMeals.length === 0 && (
          <motion.div custom={6} variants={stagger} initial="hidden" animate="show" className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border/40 mx-auto flex items-center justify-center">
              <Dumbbell size={36} className="text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">Comece seu primeiro treino!</p>
              <p className="text-xs text-muted-foreground/60 font-body">Crie uma rotina ou inicie um treino livre</p>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
