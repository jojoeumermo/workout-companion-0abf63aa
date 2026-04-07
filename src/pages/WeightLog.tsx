import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Minus, Trash2, Plus, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import PageShell from '@/components/PageShell';
import { useBodyWeight } from '@/hooks/useStorage';
import { haptic } from '@/lib/haptic';
import { toast } from 'sonner';

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
      rawDate: e.date,
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
    const changeVsStart = last30.length >= 2
      ? last30[last30.length - 1].weight - last30[0].weight
      : null;
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
      current: latest?.weight || null,
      change30: changeVsStart,
      total: entries.length,
    };
  }, [entries, latest]);

  const handleSave = () => {
    const w = parseFloat(inputWeight);
    if (!w || w < 20 || w > 300) {
      toast.error('Informe um peso válido (entre 20 e 300 kg)');
      return;
    }
    addWeight(w, inputNote.trim() || undefined);
    haptic('success');
    setInputWeight('');
    setInputNote('');
    toast.success(todayEntry ? 'Peso atualizado!' : 'Peso registrado!');
  };

  const handleDelete = (date: string) => {
    removeWeight(date);
    haptic('light');
    toast.success('Registro removido');
  };

  const avgWeight = filteredEntries.length > 0
    ? filteredEntries.reduce((s, e) => s + e.weight, 0) / filteredEntries.length
    : null;

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-5 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Peso Corporal</h1>
            <p className="text-xs text-muted-foreground font-body">Acompanhe sua evolução</p>
          </div>
        </div>

        {/* Today's entry */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">{todayEntry ? 'Atualizar Hoje' : 'Registrar Hoje'}</h3>
            </div>
            {todayEntry && (
              <span className="text-xs text-muted-foreground font-body">Atual: <span className="text-primary font-semibold">{todayEntry.weight} kg</span></span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 75.5"
              value={inputWeight}
              onChange={e => setInputWeight(e.target.value)}
              className="flex-1 bg-secondary rounded-xl px-4 py-3 text-2xl font-bold text-center outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setInputWeight(prev => String((parseFloat(prev) || (todayEntry?.weight || 70)) + 0.5))}
                className="w-12 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setInputWeight(prev => String(Math.max(0, (parseFloat(prev) || (todayEntry?.weight || 70)) - 0.5)))}
                className="w-12 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform"
              >
                <Minus size={16} />
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Observação opcional (ex: pós-treino)"
            value={inputNote}
            onChange={e => setInputNote(e.target.value)}
            className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm font-body outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSave}
            disabled={!inputWeight.trim()}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {todayEntry ? 'Atualizar' : 'Salvar'} — {inputWeight || '0'} kg
          </button>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-4 gap-2">
            <div className="bg-card rounded-2xl p-3 text-center space-y-1">
              <Scale size={14} className="text-primary mx-auto" />
              <p className="text-base font-bold">{stats.current ?? '--'}</p>
              <p className="text-[9px] text-muted-foreground font-body">kg atual</p>
            </div>
            <div className="bg-card rounded-2xl p-3 text-center space-y-1">
              <TrendingDown size={14} className="text-green-400 mx-auto" />
              <p className="text-base font-bold">{stats.min}</p>
              <p className="text-[9px] text-muted-foreground font-body">mínimo</p>
            </div>
            <div className="bg-card rounded-2xl p-3 text-center space-y-1">
              <TrendingUp size={14} className="text-red-400 mx-auto" />
              <p className="text-base font-bold">{stats.max}</p>
              <p className="text-[9px] text-muted-foreground font-body">máximo</p>
            </div>
            <div className="bg-card rounded-2xl p-3 text-center space-y-1">
              {stats.change30 !== null ? (
                stats.change30 < 0
                  ? <TrendingDown size={14} className="text-green-400 mx-auto" />
                  : stats.change30 > 0
                    ? <TrendingUp size={14} className="text-red-400 mx-auto" />
                    : <Minus size={14} className="text-muted-foreground mx-auto" />
              ) : <Minus size={14} className="text-muted-foreground mx-auto" />}
              <p className={`text-base font-bold ${stats.change30 !== null && stats.change30 < 0 ? 'text-green-400' : stats.change30 !== null && stats.change30 > 0 ? 'text-red-400' : ''}`}>
                {stats.change30 !== null ? `${stats.change30 > 0 ? '+' : ''}${stats.change30.toFixed(1)}` : '--'}
              </p>
              <p className="text-[9px] text-muted-foreground font-body">30 dias</p>
            </div>
          </motion.div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Evolução do Peso</h3>
              <div className="flex gap-1">
                {([30, 90, 365] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {p === 365 ? '1a' : `${p}d`}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  hide
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  formatter={(v: any) => [`${v} kg`, 'Peso']}
                />
                {avgWeight && (
                  <ReferenceLine
                    y={parseFloat(avgWeight.toFixed(1))}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.3}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {avgWeight && (
              <p className="text-xs text-center text-muted-foreground font-body">
                Média no período: <span className="text-primary font-semibold">{avgWeight.toFixed(1)} kg</span>
              </p>
            )}
          </motion.div>
        )}

        {/* History */}
        {entries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
            <h3 className="font-semibold text-sm px-1">Histórico</h3>
            <AnimatePresence>
              {[...entries].reverse().slice(0, 30).map(entry => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        {entry.date === today && <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-body">Hoje</span>}
                      </p>
                    </div>
                    {entry.note && <p className="text-xs text-muted-foreground font-body mt-0.5">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">{entry.weight} kg</span>
                    <button
                      onClick={() => handleDelete(entry.date)}
                      className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <Scale size={48} className="text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground font-body">Nenhum peso registrado ainda.<br />Registre seu peso de hoje para começar.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
