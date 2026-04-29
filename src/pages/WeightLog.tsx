import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Minus, Trash2, Calendar, Activity, User, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import PageShell from '@/components/PageShell';
import { useBodyWeight, useUserProfile, UserProfile } from '@/hooks/useStorage';
import { localDateKey } from '@/lib/dateUtils';
import { haptic } from '@/lib/haptic';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const QUICK_ADJUSTMENTS = [
  { label: '-1', delta: -1 },
  { label: '-0.5', delta: -0.5 },
  { label: '+0.5', delta: 0.5 },
  { label: '+1', delta: 1 },
];

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentário',
  light: 'Leve',
  moderate: 'Moderado',
  active: 'Ativo',
  very_active: 'Muito Ativo',
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcBMI(weight: number, heightCm: number) {
  if (!weight || !heightCm) return null;
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  let category = '';
  if (bmi < 18.5) category = 'Abaixo do peso';
  else if (bmi < 25) category = 'Peso normal';
  else if (bmi < 30) category = 'Sobrepeso';
  else category = 'Obesidade';
  return { value: Math.round(bmi * 10) / 10, category };
}

function calcBodyFat(sex: 'male' | 'female', waist: number, neck: number, height: number, hip: number) {
  if (!waist || !neck || !height) return null;
  if (sex === 'male') {
    if (waist <= neck) return null;
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    if (!isFinite(bf)) return null;
    return Math.max(2, Math.min(60, Math.round(bf * 10) / 10));
  } else {
    if (!hip) return null;
    if (waist + hip <= neck) return null;
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    if (!isFinite(bf)) return null;
    return Math.max(8, Math.min(60, Math.round(bf * 10) / 10));
  }
}

function calcBMR(sex: 'male' | 'female', weight: number, heightCm: number, age: number) {
  if (!weight || !heightCm || !age) return null;
  if (sex === 'male') {
    return Math.round(10 * weight + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weight + 6.25 * heightCm - 5 * age - 161);
}

export default function WeightLog() {
  const navigate = useNavigate();
  const { entries, addWeight, removeWeight, latest } = useBodyWeight();
  const [profile, setProfile] = useUserProfile();
  const [inputWeight, setInputWeight] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [period, setPeriod] = useState<30 | 90 | 365>(30);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

  const today = localDateKey();
  const todayEntry = entries.find(e => e.date === today);

  const filteredEntries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = localDateKey(cutoff);
    return entries.filter(e => e.date >= cutoffStr);
  }, [entries, period]);

  const chartData = useMemo(() =>
    filteredEntries.map(e => ({
      date: new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      weight: e.weight,
    })),
    [filteredEntries]
  );

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const weights = entries.map(e => e.weight);
    const last30 = entries.filter(e => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return e.date >= localDateKey(cutoff);
    });
    const change30 = last30.length >= 2
      ? last30[last30.length - 1].weight - last30[0].weight
      : null;
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
      current: latest?.weight ?? null,
      change30,
    };
  }, [entries, latest]);

  const currentInputVal = parseFloat(inputWeight) || 0;

  const adjust = (delta: number) => {
    const base = currentInputVal || todayEntry?.weight || (latest?.weight ?? 70);
    const next = Math.round((base + delta) * 10) / 10;
    setInputWeight(String(Math.max(20, next)));
    haptic('light');
  };

  const handleSave = () => {
    const w = parseFloat(inputWeight);
    if (!w || w < 20 || w > 300) {
      toast.error('Informe um peso válido (20–300 kg)');
      return;
    }
    addWeight(w, inputNote.trim() || undefined);
    haptic('success');
    setInputWeight('');
    setInputNote('');
    toast.success(todayEntry ? 'Peso atualizado!' : 'Peso registrado!');
  };

  const avgWeight = filteredEntries.length > 0
    ? filteredEntries.reduce((s, e) => s + e.weight, 0) / filteredEntries.length
    : null;

  const currentWeight = latest?.weight ?? 0;
  const bmi = calcBMI(currentWeight, profile.height);
  const bodyFat = calcBodyFat(profile.sex, profile.waist, profile.neck, profile.height, profile.hip);
  const bmr = calcBMR(profile.sex, currentWeight, profile.height, profile.age);
  const tdee = bmr ? Math.round(bmr * (ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.55)) : null;
  const leanMass = bodyFat !== null && currentWeight ? Math.round(currentWeight * (1 - bodyFat / 100) * 10) / 10 : null;
  const fatMass = bodyFat !== null && currentWeight ? Math.round(currentWeight * (bodyFat / 100) * 10) / 10 : null;

  const hasProfile = profile.height > 0 && profile.age > 0;

  const saveProfile = () => {
    setProfile(tempProfile);
    setShowProfileDialog(false);
    toast.success('Perfil salvo!');
  };

  return (
    <PageShell>
      <div
        className="pb-28 space-y-5 max-w-lg mx-auto"
        style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 72px)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card border border-border/30 flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">Peso Corporal</h1>
            <p className="text-xs text-muted-foreground font-body">Acompanhe sua evolução</p>
          </div>
          <button
            onClick={() => { setTempProfile(profile); setShowProfileDialog(true); }}
            className="w-10 h-10 rounded-xl bg-card border border-border/30 flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <User size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Stats row */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2.5">
            {[
              { icon: Scale, label: 'atual', value: stats.current != null ? `${stats.current}` : '--', color: 'text-primary' },
              { icon: TrendingDown, label: 'mínimo', value: `${stats.min}`, color: 'text-green-400' },
              { icon: TrendingUp, label: 'máximo', value: `${stats.max}`, color: 'text-red-400' },
              {
                icon: stats.change30 !== null && stats.change30 < 0 ? TrendingDown : TrendingUp,
                label: '30 dias',
                value: stats.change30 != null ? `${stats.change30 > 0 ? '+' : ''}${stats.change30.toFixed(1)}` : '--',
                color: stats.change30 !== null && stats.change30 < 0 ? 'text-green-400' : stats.change30 !== null && stats.change30 > 0 ? 'text-red-400' : 'text-muted-foreground',
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card-premium rounded-2xl p-3.5 text-center space-y-1.5">
                <Icon size={14} className={`mx-auto ${color}`} />
                <p className={`text-sm font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[9px] text-muted-foreground font-body">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Body composition */}
        {hasProfile && currentWeight > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="card-premium rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-primary" />
                <h3 className="font-semibold text-sm">Composição Corporal</h3>
              </div>
              <button
                onClick={() => { setTempProfile(profile); setShowProfileDialog(true); }}
                className="text-xs text-primary font-medium"
              >
                Editar Perfil
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {bmi && (
                <div className="bg-secondary rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">IMC</p>
                  <p className="text-lg font-bold text-primary">{bmi.value}</p>
                  <p className={`text-[10px] font-medium ${
                    bmi.category === 'Peso normal' ? 'text-green-400' :
                    bmi.category === 'Abaixo do peso' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{bmi.category}</p>
                </div>
              )}
              {bodyFat !== null && (
                <div className="bg-secondary rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">Gordura Corp.</p>
                  <p className="text-lg font-bold text-primary">{bodyFat}%</p>
                  <p className="text-[10px] text-muted-foreground font-body">Navy Method</p>
                </div>
              )}
              {bmr && (
                <div className="bg-secondary rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">TMB</p>
                  <p className="text-lg font-bold text-primary">{bmr}</p>
                  <p className="text-[10px] text-muted-foreground font-body">kcal/dia</p>
                </div>
              )}
              {tdee && (
                <div className="bg-secondary rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">TDEE</p>
                  <p className="text-lg font-bold text-primary">{tdee}</p>
                  <p className="text-[10px] text-muted-foreground font-body">kcal/dia ({ACTIVITY_LABELS[profile.activityLevel]})</p>
                </div>
              )}
              {leanMass !== null && (
                <div className="bg-secondary rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">Massa Magra</p>
                  <p className="text-lg font-bold text-green-400">{leanMass} kg</p>
                </div>
              )}
              {fatMass !== null && (
                <div className="bg-secondary rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-body">Massa Gorda</p>
                  <p className="text-lg font-bold text-yellow-400">{fatMass} kg</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Setup prompt if no profile */}
        {!hasProfile && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Composição Corporal</h3>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Configure seu perfil para ver IMC, gordura corporal, metabolismo basal e TDEE.
            </p>
            <button
              onClick={() => { setTempProfile(profile); setShowProfileDialog(true); }}
              className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-xs font-semibold active:scale-95 transition-transform"
            >
              Configurar Perfil
            </button>
          </motion.div>
        )}

        {/* Weight entry card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="card-premium rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={15} className="text-primary" />
              <h3 className="font-semibold text-sm">{todayEntry ? 'Atualizar hoje' : 'Registrar hoje'}</h3>
            </div>
            {todayEntry && (
              <span className="text-xs text-muted-foreground font-body">Hoje: <span className="text-primary font-semibold">{todayEntry.weight} kg</span></span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder={todayEntry ? String(todayEntry.weight) : latest ? String(latest.weight) : '70.0'}
              value={inputWeight}
              onChange={e => setInputWeight(e.target.value)}
              className="w-full bg-secondary rounded-2xl py-5 text-center text-4xl font-black tracking-tight outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/30"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body pointer-events-none">kg</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ADJUSTMENTS.map(({ label, delta }) => (
              <button
                key={label}
                onClick={() => adjust(delta)}
                className={`py-2.5 rounded-xl text-xs font-semibold active:scale-90 transition-transform ${
                  delta > 0
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Observação (ex: pós-treino, manhã em jejum...)"
            value={inputNote}
            onChange={e => setInputNote(e.target.value)}
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
          />

          <button
            onClick={handleSave}
            disabled={!inputWeight.trim() || parseFloat(inputWeight) < 20}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
          >
            {todayEntry ? 'Atualizar' : 'Salvar'} — {inputWeight || '–'} kg
          </button>
        </motion.div>

        {/* Chart */}
        {chartData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card-premium rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Evolução</h3>
              <div className="flex gap-1.5">
                {([30, 90, 365] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      period === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {p === 365 ? '1a' : `${p}d`}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(0 0% 55%)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(225 12% 10%)', border: '1px solid hsl(225 8% 16%)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  formatter={(v: any) => [`${v} kg`, 'Peso']}
                />
                {avgWeight && (
                  <ReferenceLine y={parseFloat(avgWeight.toFixed(1))} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.35} />
                )}
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            {avgWeight && (
              <p className="text-[11px] text-center text-muted-foreground font-body">
                Média: <span className="text-primary font-semibold">{avgWeight.toFixed(1)} kg</span>
              </p>
            )}
          </motion.div>
        )}

        {/* History */}
        {entries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-2.5">
            <h3 className="font-semibold text-sm px-0.5">Histórico</h3>
            <AnimatePresence>
              {[...entries].reverse().slice(0, 30).map(entry => {
                const isToday = entry.date === today;
                return (
                  <motion.div
                    key={entry.date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="card-premium rounded-xl px-4 py-3.5 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar size={11} className="text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium">
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                        {isToday && (
                          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-body font-medium">Hoje</span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">{entry.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      <span className="text-lg font-bold text-primary">{entry.weight}</span>
                      <span className="text-xs text-muted-foreground font-body">kg</span>
                      <button
                        onClick={() => { removeWeight(entry.date); haptic('light'); toast.success('Removido'); }}
                        className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border/30 mx-auto flex items-center justify-center">
              <Scale size={36} className="text-muted-foreground/20" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">Nenhum peso registrado</p>
              <p className="text-xs text-muted-foreground/60 font-body">Registre agora para acompanhar sua evolução</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil Corporal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground font-body">
              Dados usados para calcular IMC, gordura corporal (Navy Method), metabolismo basal (Mifflin-St Jeor) e TDEE.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Altura (cm)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="170"
                  value={tempProfile.height || ''}
                  onChange={e => setTempProfile(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Idade</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="25"
                  value={tempProfile.age || ''}
                  onChange={e => setTempProfile(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Sexo biológico</label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setTempProfile(p => ({ ...p, sex: s }))}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${tempProfile.sex === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {s === 'male' ? 'Masculino' : 'Feminino'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Nível de atividade</label>
              <div className="flex flex-wrap gap-1.5">
                {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => setTempProfile(p => ({ ...p, activityLevel: a }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${tempProfile.activityLevel === a ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {ACTIVITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/40 pt-3 mt-2">
              <p className="text-xs text-muted-foreground font-body mb-2">Medidas para gordura corporal (Navy Method)</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-body">Pescoço (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="38"
                    value={tempProfile.neck || ''}
                    onChange={e => setTempProfile(p => ({ ...p, neck: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-body">Cintura (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="80"
                    value={tempProfile.waist || ''}
                    onChange={e => setTempProfile(p => ({ ...p, waist: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-body">Quadril (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="95"
                    value={tempProfile.hip || ''}
                    onChange={e => setTempProfile(p => ({ ...p, hip: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm mt-2"
            >
              Salvar Perfil
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
