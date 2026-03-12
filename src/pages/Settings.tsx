import { useState } from 'react';
import { Download, Upload, Palette, Trash2, FileJson, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory, useTemplates, usePersonalRecords, useGoals, useTheme } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const themes = [
  { id: 'green', label: 'Verde Fitness', primary: '130 60% 50%', accent: '130 60% 50%' },
  { id: 'blue', label: 'Azul', primary: '210 80% 55%', accent: '210 80% 55%' },
  { id: 'orange', label: 'Laranja', primary: '25 90% 55%', accent: '25 90% 55%' },
  { id: 'purple', label: 'Roxo', primary: '270 70% 60%', accent: '270 70% 60%' },
  { id: 'red', label: 'Vermelho', primary: '0 75% 55%', accent: '0 75% 55%' },
  { id: 'cyan', label: 'Ciano', primary: '180 70% 45%', accent: '180 70% 45%' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [history, setHistory] = useHistory();
  const [templates, setTemplates] = useTemplates();
  const { records } = usePersonalRecords();
  const { goals } = useGoals();
  const [theme, setTheme] = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const applyTheme = (themeId: string) => {
    const t = themes.find(t => t.id === themeId);
    if (!t) return;
    document.documentElement.style.setProperty('--primary', t.primary);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--ring', t.primary);
    setTheme(themeId);
  };

  // Apply saved theme on mount
  useState(() => {
    if (theme && theme !== 'green') applyTheme(theme);
  });

  const exportJSON = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: JSON.parse(localStorage.getItem('workout-templates') || '[]'),
      history: JSON.parse(localStorage.getItem('workout-history') || '[]'),
      records: JSON.parse(localStorage.getItem('personal-records') || '[]'),
      goals: JSON.parse(localStorage.getItem('workout-goals') || '[]'),
      favorites: JSON.parse(localStorage.getItem('favorite-exercises') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitapp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado com sucesso!');
  };

  const exportCSV = () => {
    const rows = ['Data,Treino,Exercício,Série,Peso(kg),Reps,Volume(kg)'];
    history.forEach(w => {
      w.exercises.forEach(ex => {
        const name = ex.exerciseId;
        ex.sets.filter(s => s.completed).forEach((s, i) => {
          rows.push(`${new Date(w.completedAt).toLocaleDateString('pt-BR')},${w.name},${name},${i + 1},${s.weight},${s.reps},${s.weight * s.reps}`);
        });
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitapp-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.templates) localStorage.setItem('workout-templates', JSON.stringify(data.templates));
          if (data.history) localStorage.setItem('workout-history', JSON.stringify(data.history));
          if (data.records) localStorage.setItem('personal-records', JSON.stringify(data.records));
          if (data.goals) localStorage.setItem('workout-goals', JSON.stringify(data.goals));
          if (data.favorites) localStorage.setItem('favorite-exercises', JSON.stringify(data.favorites));
          toast.success('Backup restaurado! Recarregando...');
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast.error('Arquivo inválido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAllData = () => {
    localStorage.removeItem('workout-templates');
    localStorage.removeItem('workout-history');
    localStorage.removeItem('personal-records');
    localStorage.removeItem('workout-goals');
    localStorage.removeItem('favorite-exercises');
    localStorage.removeItem('active-workout');
    toast.success('Dados limpos! Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <PageShell>
      <div className="pt-14 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Tema de Cor</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`rounded-xl p-3 text-xs font-medium text-center transition-all ${
                  theme === t.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'
                }`}
              >
                <div className="w-6 h-6 rounded-full mx-auto mb-1.5" style={{ background: `hsl(${t.primary})` }} />
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Export/Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Backup & Exportação</h3>
          </div>
          <div className="space-y-2">
            <button onClick={exportJSON} className="w-full bg-secondary rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <FileJson size={18} className="text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Exportar Backup (JSON)</p>
                <p className="text-xs text-muted-foreground font-body">Todos os dados do app</p>
              </div>
            </button>
            <button onClick={exportCSV} className="w-full bg-secondary rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <FileText size={18} className="text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Exportar Histórico (CSV)</p>
                <p className="text-xs text-muted-foreground font-body">Para planilhas</p>
              </div>
            </button>
            <button onClick={importJSON} className="w-full bg-secondary rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <Upload size={18} className="text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Importar Backup</p>
                <p className="text-xs text-muted-foreground font-body">Restaurar dados de um arquivo JSON</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Estatísticas</h3>
          <div className="space-y-2 text-sm font-body text-muted-foreground">
            <div className="flex justify-between"><span>Rotinas salvas</span><span className="text-foreground font-medium">{templates.length}</span></div>
            <div className="flex justify-between"><span>Treinos completados</span><span className="text-foreground font-medium">{history.length}</span></div>
            <div className="flex justify-between"><span>Recordes pessoais</span><span className="text-foreground font-medium">{records.length}</span></div>
            <div className="flex justify-between"><span>Metas ativas</span><span className="text-foreground font-medium">{goals.length}</span></div>
          </div>
        </motion.div>

        {/* Danger */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full bg-destructive/10 text-destructive rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Trash2 size={18} />
            <span className="font-medium text-sm">Limpar Todos os Dados</span>
          </button>
        </motion.div>
      </div>

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Limpar Todos os Dados?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground font-body">Esta ação é irreversível. Todos os seus treinos, rotinas e recordes serão apagados.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-secondary rounded-xl py-3 font-medium text-sm">Cancelar</button>
              <button onClick={() => { clearAllData(); setShowClearConfirm(false); }} className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-3 font-semibold text-sm">Apagar Tudo</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
