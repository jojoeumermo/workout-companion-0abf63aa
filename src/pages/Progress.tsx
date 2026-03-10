import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import PageShell from '@/components/PageShell';
import { useHistory } from '@/hooks/useStorage';

export default function Progress() {
  const [history] = useHistory();

  // Weekly volume data (last 8 weeks)
  const weeklyData: { week: string; volume: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const now = new Date();
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const volume = history
      .filter(w => {
        const d = new Date(w.completedAt);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, w) => sum + w.totalVolume, 0);
    weeklyData.push({
      week: `S${8 - i}`,
      volume: Math.round(volume / 1000),
    });
  }

  // Workout frequency (last 4 weeks)
  const freqData: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const now = new Date();
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count = history.filter(w => {
      const d = new Date(w.completedAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    freqData.push({ week: `Sem ${4 - i}`, count });
  }

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((s, w) => s + w.totalVolume, 0);

  return (
    <PageShell title="Progresso">
      <div className="space-y-6">
        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-4 space-y-1">
            <Calendar size={18} className="text-primary" />
            <p className="text-2xl font-bold">{totalWorkouts}</p>
            <p className="text-xs text-muted-foreground font-body">treinos totais</p>
          </div>
          <div className="bg-card rounded-2xl p-4 space-y-1">
            <TrendingUp size={18} className="text-primary" />
            <p className="text-2xl font-bold">{(totalVolume / 1000).toFixed(1)}t</p>
            <p className="text-xs text-muted-foreground font-body">volume total</p>
          </div>
        </motion.div>

        {/* Volume Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Volume Semanal (ton)</h3>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="week" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  cursor={false}
                />
                <Bar dataKey="volume" fill="hsl(130 60% 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>

        {/* Frequency Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Frequência Semanal</h3>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={freqData}>
                <XAxis dataKey="week" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(240 2% 18%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  cursor={false}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(130 60% 50%)" strokeWidth={2} dot={{ fill: 'hsl(130 60% 50%)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex items-center justify-center text-muted-foreground font-body text-sm">
              Complete treinos para ver seus dados
            </div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}
