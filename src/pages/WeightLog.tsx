import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Minus, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import PageShell from '@/components/PageShell';
import { useBodyWeight } from '@/hooks/useStorage';
import { haptic } from '@/lib/haptic';
import { toast } from 'sonner';

const QUICK_ADJUSTMENTS = [
  { label: '-1', delta: -1 },
  { label: '-0.5', delta: -0.5 },
  { label: '+0.5', delta: 0.5 },
  { label: '+1', delta: 1 },
];

export default function WeightLog() {
  const navigate = useNavigate();
  const { entries, addWeight, removeWeight, latest } = useBodyWeight();
  const [inputWeight, setInputWeight] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [period, setPeriod] = useState<30 | 90 | 365>(30);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);

  const filteredEntries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = cutoff.toISOString().split('T')[0];
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
      return e.date >= cutoff.toISOString().split('T')[0];
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
          <div>
            <h1 className="text-xl font-bold leading-tight">Peso Corporal</h1>
            <p className="text-xs text-muted-foreground font-body">Acompanhe sua evolução</p>
          </div>
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

          {/* Big number input */}
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

          {/* Quick adjust buttons */}
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

          {/* Note */}
          <input
            type="text"
            placeholder="Observação (ex: pós-treino, manhã em jejum...)"
            value={inputNote}
            onChange={e => setInputNote(e.target.value)}
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
          />

          {/* Save button */}
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
    </PageShell>
  );
}
