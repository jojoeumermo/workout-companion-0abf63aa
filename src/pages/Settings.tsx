import { useState } from 'react';
import { Download, Upload, Palette, Trash2, FileJson, FileText, ArrowLeft, Scale, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory, useTemplates, usePersonalRecords, useGoals, useTheme } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const themes = [
  { id: 'green', label: 'Verde', primary: '130 60% 50%', accent: '130 60% 50%' },
  { id: 'blue', label: 'Azul', primary: '210 80% 55%', accent: '210 80% 55%' },
  { id: 'orange', label: 'Laranja', primary: '25 90% 55%', accent: '25 90% 55%' },
  { id: 'purple', label: 'Roxo', primary: '270 70% 60%', accent: '270 70% 60%' },
  { id: 'red', label: 'Vermelho', primary: '0 75% 55%', accent: '0 75% 55%' },
  { id: 'cyan', label: 'Ciano', primary: '180 70% 45%', accent: '180 70% 45%' },
];

const MEASUREMENT_KEYS = [
  { key: 'chest', label: 'Peito (cm)' },
  { key: 'waist', label: 'Cintura (cm)' },
  { key: 'hips', label: 'Quadril (cm)' },
  { key: 'leftArm', label: 'Braço Esq (cm)' },
  { key: 'rightArm', label: 'Braço Dir (cm)' },
  { key: 'leftThigh', label: 'Coxa Esq (cm)' },
  { key: 'rightThigh', label: 'Coxa Dir (cm)' },
  { key: 'shoulders', label: 'Ombros (cm)' },
  { key: 'calf', label: 'Panturrilha (cm)' },
];

type Measurements = Record<string, string>;

function loadMeasurements(): Measurements {
  try { return JSON.parse(localStorage.getItem('body-measurements') || '{}'); } catch { return {}; }
}

export default function Settings() {
  const navigate = useNavigate();
  const [history, setHistory] = useHistory();
  const [templates, setTemplates] = useTemplates();
  const { records } = usePersonalRecords();
  const { goals } = useGoals();
  const [theme, setTheme] = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>(loadMeasurements);
  const [tempMeasurements, setTempMeasurements] = useState<Measurements>(loadMeasurements);

  const applyTheme = (themeId: string) => {
    const t = themes.find(t => t.id === themeId);
    if (!t) return;
    document.documentElement.style.setProperty('--primary', t.primary);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--ring', t.primary);
    setTheme(themeId);
  };

  useState(() => {
    if (theme && theme !== 'green') applyTheme(theme);
  });

  const exportJSON = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      templates: JSON.parse(localStorage.getItem('workout-templates') || '[]'),
      history: JSON.parse(localStorage.getItem('workout-history') || '[]'),
      records: JSON.parse(localStorage.getItem('personal-records') || '[]'),
      goals: JSON.parse(localStorage.getItem('workout-goals') || '[]'),
      favorites: JSON.parse(localStorage.getItem('favorite-exercises') || '[]'),
      meals: JSON.parse(localStorage.getItem('meal-history') || '[]'),
      nutritionGoals: JSON.parse(localStorage.getItem('nutrition-goals') || 'null'),
      bodyWeight: JSON.parse(localStorage.getItem('body-weight') || '[]'),
      waterLog: JSON.parse(localStorage.getItem('water-log') || '{}'),
      measurements: JSON.parse(localStorage.getItem('body-measurements') || '{}'),
      folders: JSON.parse(localStorage.getItem('workout-folders') || '[]'),
      theme: localStorage.getItem('app-theme') || 'green',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup completo exportado!');
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
    a.download = `fitai-treinos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
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
          if (data.meals) localStorage.setItem('meal-history', JSON.stringify(data.meals));
          if (data.nutritionGoals) localStorage.setItem('nutrition-goals', JSON.stringify(data.nutritionGoals));
          if (data.bodyWeight) localStorage.setItem('body-weight', JSON.stringify(data.bodyWeight));
          if (data.waterLog) localStorage.setItem('water-log', JSON.stringify(data.waterLog));
          if (data.measurements) localStorage.setItem('body-measurements', JSON.stringify(data.measurements));
          if (data.folders) localStorage.setItem('workout-folders', JSON.stringify(data.folders));
          if (data.theme) localStorage.setItem('app-theme', data.theme);
          toast.success('Backup restaurado! Recarregando...');
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast.error('Arquivo inválido ou corrompido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAllData = () => {
    const keys = [
      'workout-templates', 'workout-history', 'personal-records', 'workout-goals',
      'favorite-exercises', 'active-workout', 'meal-history', 'nutrition-goals',
      'body-weight', 'water-log', 'body-measurements', 'workout-folders',
    ];
    keys.forEach(k => localStorage.removeItem(k));
    toast.success('Todos os dados apagados! Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const saveMeasurements = () => {
    localStorage.setItem('body-measurements', JSON.stringify(tempMeasurements));
    setMeasurements(tempMeasurements);
    setShowMeasurements(false);
    toast.success('Medidas salvas!');
  };

  const mealsCount = JSON.parse(localStorage.getItem('meal-history') || '[]').length;
  const weightCount = JSON.parse(localStorage.getItem('body-weight') || '[]').length;
  const hasMeasurements = Object.values(measurements).some(v => v !== '');

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-5 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Configurações</h1>
            <p className="text-xs text-muted-foreground font-body">Personalize seu app</p>
          </div>
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
                className={`rounded-xl p-3 text-xs font-medium text-center transition-all active:scale-95 ${
                  theme === t.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'
                }`}
              >
                <div className="w-7 h-7 rounded-full mx-auto mb-1.5" style={{ background: `hsl(${t.primary})` }} />
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Body Measurements */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="bg-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Medidas Corporais</h3>
            </div>
            <button
              onClick={() => { setTempMeasurements(measurements); setShowMeasurements(true); }}
              className="text-xs text-primary font-medium"
            >
              {hasMeasurements ? 'Editar' : 'Adicionar'}
            </button>
          </div>
          {hasMeasurements ? (
            <div className="grid grid-cols-3 gap-2">
              {MEASUREMENT_KEYS.filter(k => measurements[k.key]).map(({ key, label }) => (
                <div key={key} className="bg-secondary rounded-xl p-2.5 text-center">
                  <p className="text-sm font-bold">{measurements[key]}</p>
                  <p className="text-[9px] text-muted-foreground font-body">{label.split(' (')[0]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Registre suas medidas para acompanhar evolução do corpo.</p>
          )}
          <button onClick={() => navigate('/peso')} className="w-full bg-secondary rounded-xl p-3 flex items-center gap-2.5 active:scale-[0.98] transition-transform">
            <Scale size={16} className="text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium">Peso Corporal</p>
              <p className="text-xs text-muted-foreground font-body">{weightCount} registros • ver histórico e gráfico</p>
            </div>
          </button>
        </motion.div>

        {/* Export/Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Backup & Exportação</h3>
          </div>
          <p className="text-[10px] text-muted-foreground font-body">Inclui treinos, refeições, peso corporal, medidas e configurações.</p>
          <div className="space-y-2">
            <button onClick={exportJSON} className="w-full bg-secondary rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <FileJson size={18} className="text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Exportar Backup Completo (JSON)</p>
                <p className="text-xs text-muted-foreground font-body">Todos os dados — treinos, nutrição, peso</p>
              </div>
            </button>
            <button onClick={exportCSV} className="w-full bg-secondary rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <FileText size={18} className="text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Exportar Histórico (CSV)</p>
                <p className="text-xs text-muted-foreground font-body">Para planilhas e análise externa</p>
              </div>
            </button>
            <button onClick={importJSON} className="w-full bg-secondary rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <Upload size={18} className="text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Importar Backup</p>
                <p className="text-xs text-muted-foreground font-body">Restaurar todos os dados de um arquivo</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-card rounded-2xl p-5 space-y-2.5">
          <h3 className="font-semibold text-sm">Resumo dos Dados</h3>
          <div className="space-y-2 text-sm font-body text-muted-foreground">
            <div className="flex justify-between"><span>Rotinas salvas</span><span className="text-foreground font-medium">{templates.length}</span></div>
            <div className="flex justify-between"><span>Treinos completados</span><span className="text-foreground font-medium">{history.length}</span></div>
            <div className="flex justify-between"><span>Recordes pessoais</span><span className="text-foreground font-medium">{records.length}</span></div>
            <div className="flex justify-between"><span>Metas ativas</span><span className="text-foreground font-medium">{goals.length}</span></div>
            <div className="flex justify-between"><span>Refeições registradas</span><span className="text-foreground font-medium">{mealsCount}</span></div>
            <div className="flex justify-between"><span>Registros de peso</span><span className="text-foreground font-medium">{weightCount}</span></div>
          </div>
        </motion.div>

        {/* Danger */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full bg-destructive/10 text-destructive rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Trash2 size={18} />
            <span className="font-medium text-sm">Limpar Todos os Dados</span>
          </button>
        </motion.div>
      </div>

      {/* Measurements dialog */}
      <Dialog open={showMeasurements} onOpenChange={setShowMeasurements}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medidas Corporais</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground font-body">Registre suas medidas atuais em centímetros.</p>
            <div className="grid grid-cols-2 gap-2">
              {MEASUREMENT_KEYS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground font-body">{label}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={tempMeasurements[key] || ''}
                    onChange={e => setTempMeasurements(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveMeasurements}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm mt-2"
            >
              Salvar Medidas
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Limpar Todos os Dados?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground font-body">Esta ação é irreversível. <strong>Todos</strong> os seus dados — treinos, refeições, peso, medidas — serão apagados permanentemente.</p>
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
