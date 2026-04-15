import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Dumbbell, TrendingUp, Flame, Zap, Target, ChevronRight, Bot, BookOpen, Settings, UtensilsCrossed, Camera, Scale, Droplets, Clock, Trophy, AlertTriangle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory, useTemplates, useActiveWorkout, useGoals, useTheme, useMeals, useBodyWeight, useWaterLog, useUserProfile, usePersonalRecords } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { ActiveWorkout } from '@/types/workout';
import { computeGamification } from '@/lib/gamification';
import { detectStagnation, detectOvertraining } from '@/lib/workoutAnalysis';
import { getMuscleColor } from '@/lib/muscleColors';
import { haptic } from '@/lib/haptic';

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
  const { latest: latestWeight } = useBodyWeight();
  const { getTodayWater } = useWaterLog();
  const [userProfile] = useUserProfile();
  const { records } = usePersonalRecords();

  useEffect(() => {
    if (theme && themes[theme]) {
      document.documentElement.style.setProperty('--primary', themes[theme]);
      document.documentElement.style.setProperty('--accent', themes[theme]);
      document.documentElement.style.setProperty('--ring', themes[theme]);
    }
  }, [theme]);

  const thisWeek = history.filter(w => {
    const d = new Date(w.completedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const weekVolume = thisWeek.reduce((sum, w) => sum + w.totalVolume, 0);
  const weekCount = thisWeek.length;

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.date === today);
  const todayCalories = todayMeals.reduce((s, m) => s + m.totals.calories, 0);

  const recentWorkouts = history.slice(-3).reverse();

  // Gamification
  const gam = useMemo(() => computeGamification(history, records.length), [history, records.length]);

  // AI Insights (surface them on dashboard)
  const stagnationAlerts = useMemo(() => history.length >= 5 ? detectStagnation(history, 3).slice(0, 2) : [], [history]);
  const overtAlert = useMemo(() => detectOvertraining(history), [history]);

  // Weekly muscle distribution
  const weeklyMuscles = useMemo(() => {
    const dist: Record<string, number> = {};
    thisWeek.forEach(w => {
      w.exercises.forEach(e => {
        const ex = getExerciseById(e.exerciseId);
        if (ex) {
          const vol = e.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0);
          dist[ex.muscleGroup] = (dist[ex.muscleGroup] || 0) + vol;
        }
      });
    });
    return Object.entries(dist)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [thisWeek]);

  const startFreeWorkout = () => {
    const active: ActiveWorkout = {
      name: 'Treino Livre',
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      exercises: [],
    };
    setActiveWorkout(active);
    haptic('medium');
    navigate('/treino-ativo');
  };

  const weeklyGoal = goals.find(g => g.type === 'weekly_frequency');
  const goalProgress = weeklyGoal ? Math.min(weekCount / weeklyGoal.target, 1) : null;


  return (
    <PageShell>
      <div className="pt-16 space-y-5 max-w-lg mx-auto pb-6">
        {/* Hero Header */}
        <motion.div custom={0} variants={stagger} initial="hidden" animate="show">
          <div className="hero-section -mx-5 sm:-mx-6 mb-6" style={{ height: '220px' }}>
            <img
              src="/images/hero-gym.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.55) contrast(1.1)' }}
            />
            <div className="hero-img-overlay" />
            <button
              onClick={() => navigate('/configuracoes')}
              className="absolute top-4 right-5 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 z-10"
              style={{ top: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 20px)' }}
            >
              <Settings size={19} />
            </button>
            <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
              <div>
                <p className="text-white/65 font-body text-sm mb-0.5">Pronto para superar?</p>
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                  Olá, {userProfile?.name || 'Atleta'}
                </h1>
              </div>
              {/* Streak badge on hero */}
              {gam.currentStreak > 0 && (
                <div className="flex flex-col items-center bg-black/50 backdrop-blur-sm border border-white/15 rounded-2xl px-3 py-2">
                  <span className="text-2xl font-black text-orange-400 leading-none">{gam.currentStreak}</span>
                  <span className="text-[10px] font-bold text-white/60 mt-0.5">🔥 streak</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Level + XP Bar */}
        {history.length > 0 && (
          <motion.div custom={1} variants={stagger} initial="hidden" animate="show"
            className="card-premium rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Star size={16} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">Nível {gam.level.level}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 ${gam.level.color}`}>{gam.level.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-body">{gam.totalXP.toLocaleString()} XP no total</span>
                </div>
              </div>
              <div className="text-right">
                {gam.nextLevel ? (
                  <>
                    <p className="text-xs font-bold text-primary">{gam.xpInCurrentLevel}<span className="text-muted-foreground font-body">/{gam.xpToNextLevel} XP</span></p>
                    <p className="text-[10px] text-muted-foreground font-body">até {gam.nextLevel.name}</p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-primary">Nível máximo 🏆</p>
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${gam.xpProgressPercent}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
              <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {gam.currentStreak} dias seguidos</span>
              <span className="flex items-center gap-1"><Trophy size={12} className="text-primary" /> {records.length} recordes pessoais</span>
              <span className="flex items-center gap-1"><Dumbbell size={12} /> {history.length} treinos</span>
            </div>
          </motion.div>
        )}

        {/* Primary CTA */}
        <motion.div custom={2} variants={stagger} initial="hidden" animate="show" className="space-y-3">
          <button
            onClick={() => navigate('/treinos')}
            className="w-full relative overflow-hidden rounded-2xl p-5 py-6 flex items-center justify-between active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
              boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.4)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="text-left relative z-10">
              <span className="text-xl font-black block text-primary-foreground">Iniciar Treino</span>
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
                className="card-premium rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-[0.96] transition-all hover:border-primary/25 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <span className="font-bold text-[11px] text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Today strip */}
        <motion.div custom={3} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-2.5">
          {[
            { icon: UtensilsCrossed, value: Math.round(todayCalories).toString(), sub: 'kcal hoje', color: 'text-orange-400', bg: 'bg-orange-500/10', route: '/nutricao' },
            { icon: Droplets, value: `${((getTodayWater()) / 1000).toFixed(1).replace('.', ',')}L`, sub: 'água hoje', color: 'text-blue-400', bg: 'bg-blue-500/10', route: '/nutricao' },
            { icon: Scale, value: latestWeight ? `${latestWeight.weight}` : '--', sub: latestWeight ? 'kg peso' : 'registrar', color: 'text-primary', bg: 'bg-primary/10', route: '/peso' },
          ].map(({ icon: Icon, value, sub, color, bg, route }) => (
            <button
              key={sub}
              onClick={() => navigate(route)}
              className="card-premium rounded-2xl p-4 text-left active:scale-[0.96] transition-all hover:border-primary/20"
            >
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={15} className={color} />
              </div>
              <p className="text-2xl font-black leading-none tracking-tight">{value}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-1.5">{sub}</p>
            </button>
          ))}
        </motion.div>

        {/* Weekly Goal */}
        {goalProgress !== null && weeklyGoal && (
          <motion.div custom={4} variants={stagger} initial="hidden" animate="show" className="card-premium rounded-2xl p-4 space-y-3">
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
                style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}
              />
            </div>
          </motion.div>
        )}

        {/* AI Alerts — Overtraining */}
        {overtAlert.risk !== 'low' && (
          <motion.div custom={5} variants={stagger} initial="hidden" animate="show"
            className={`rounded-2xl p-4 space-y-2.5 border ${overtAlert.risk === 'high' ? 'bg-red-500/8 border-red-500/25' : 'bg-orange-500/8 border-orange-500/25'}`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className={overtAlert.risk === 'high' ? 'text-red-400' : 'text-orange-400'} />
              <span className="font-bold text-sm">
                {overtAlert.risk === 'high' ? 'Risco Alto de Overtraining' : 'Atenção: Volume Elevado'}
              </span>
            </div>
            <ul className="space-y-1">
              {overtAlert.reasons.slice(0, 2).map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground font-body flex items-start gap-1.5">
                  <span className="text-orange-400 mt-0.5 shrink-0">•</span> {r}
                </li>
              ))}
            </ul>
            {overtAlert.suggestions.length > 0 && (
              <p className="text-xs font-medium text-foreground bg-secondary/60 rounded-lg px-3 py-2 font-body">
                💡 {overtAlert.suggestions[0]}
              </p>
            )}
          </motion.div>
        )}

        {/* Stagnation alerts */}
        {stagnationAlerts.length > 0 && (
          <motion.div custom={5.5} variants={stagger} initial="hidden" animate="show"
            className="card-premium rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <span className="font-bold text-sm">Progresso para Avaliar</span>
            </div>
            {stagnationAlerts.map((alert, i) => (
              <div key={i} className="bg-secondary/60 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{alert.exerciseName}</p>
                  <p className="text-xs text-muted-foreground font-body">{alert.avgWeight}kg por {alert.workoutCount} treinos</p>
                </div>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">Estagnado</span>
              </div>
            ))}
            <button onClick={() => navigate('/ai-coach')} className="text-xs text-primary font-bold flex items-center gap-1">
              <Bot size={12} /> Pedir sugestões ao FitAI <ChevronRight size={12} />
            </button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div custom={6} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          <div className="card-premium rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Flame size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground font-body uppercase tracking-wider">Semana</span>
            </div>
            <div>
              <p className="text-4xl font-black tracking-tight">{weekCount}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">treinos realizados</p>
            </div>
          </div>
          <div className="card-premium rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground font-body uppercase tracking-wider">Volume</span>
            </div>
            <div>
              <p className="text-4xl font-black tracking-tight">{weekVolume > 1000 ? `${(weekVolume / 1000).toFixed(1)}t` : `${weekVolume}kg`}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">volume semanal</p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Muscle Distribution */}
        {weeklyMuscles.length > 0 && (
          <motion.div custom={7} variants={stagger} initial="hidden" animate="show" className="card-premium rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Músculos desta Semana</h3>
              <button onClick={() => navigate('/progresso')} className="text-xs text-primary font-bold flex items-center gap-0.5">
                Ver mais <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2.5">
              {weeklyMuscles.map(([muscle, vol], i) => {
                const c = getMuscleColor(muscle);
                const maxVol = weeklyMuscles[0][1];
                const pct = Math.round((vol / maxVol) * 100);
                return (
                  <div key={muscle} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${c.text}`}>{muscle}</span>
                      <span className="text-[10px] text-muted-foreground font-body">{(vol / 1000).toFixed(1)}t</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
                        className={`h-full rounded-full ${c.bg.replace('/15', '')}`}
                        style={{ opacity: 0.9 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* AI Coach */}
        <motion.button
          custom={8}
          variants={stagger}
          initial="hidden"
          animate="show"
          onClick={() => navigate('/ai-coach')}
          className="w-full card-premium animate-pulse-glow rounded-2xl p-5 flex items-center justify-between active:scale-[0.97] transition-all hover:border-primary/20 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Bot size={22} className="text-primary" />
            </div>
            <div className="text-left">
              <span className="font-bold text-[15px] block">FitAI Coach</span>
              <span className="text-[11px] text-muted-foreground font-body mt-0.5">
                {stagnationAlerts.length > 0 ? `${stagnationAlerts.length} exercícios para analisar` : 'Pergunte sobre treino ou nutrição'}
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.button>

        {/* Recent */}
        {recentWorkouts.length > 0 && (
          <motion.div custom={9} variants={stagger} initial="hidden" animate="show" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Últimos Treinos</h2>
              <button onClick={() => navigate('/historico')} className="text-xs text-primary font-bold flex items-center gap-0.5 hover:underline">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2.5">
              {recentWorkouts.map((w, i) => (
                <motion.button
                  key={w.id}
                  custom={10 + i}
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
          <motion.div custom={9} variants={stagger} initial="hidden" animate="show" className="text-center py-16 space-y-4">
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
