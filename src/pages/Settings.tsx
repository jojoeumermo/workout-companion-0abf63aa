import { useState } from 'react';
import { Download, Upload, Palette, Trash2, FileJson, FileText, ArrowLeft, Scale, Ruler, User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { useHistory, useTemplates, usePersonalRecords, useGoals, useTheme, useUserProfile, UserProfile } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const themes = [
  { id: 'green', label: 'Verde', primary: '130 60% 50%', accent: '130 60% 50%' },
  { id: 'blue', label: 'Azul', primary: '210 80% 55%', accent: '210 80% 55%' },
  { id: 'orange', label: 'Laranja', primary: '25 90% 55%', accent: '25 90% 55%' },
  { id: 'purple', label: 'Roxo', primary: '270 70% 60%', accent: '270 70% 60%' },
  { id: 'red', label: 'Vermelho', primary: '0 75% 55%', accent: '0 75% 55%' },
  { id: 'cyan', label: 'Ciano', primary: '180 70% 45%', accent: '180 70% 45%' },
  { id: 'pink', label: 'Rosa', primary: '330 75% 60%', accent: '330 75% 60%' },
  { id: 'amber', label: 'Âmbar', primary: '40 90% 50%', accent: '40 90% 50%' },
  { id: 'teal', label: 'Verde-azul', primary: '160 60% 45%', accent: '160 60% 45%' },
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

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentário',
  light: 'Leve',
  moderate: 'Moderado',
  active: 'Ativo',
  very_active: 'Muito Ativo',
};

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
  const [profile, setProfile] = useUserProfile();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>(loadMeasurements);
  const [tempMeasurements, setTempMeasurements] = useState<Measurements>(loadMeasurements);
  const [showProfile, setShowProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

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
      version: 3,
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
      waterGoal: JSON.parse(localStorage.getItem('water-goal') || '2500'),
      measurements: JSON.parse(localStorage.getItem('body-measurements') || '{}'),
      folders: JSON.parse(localStorage.getItem('workout-folders') || '[]'),
      theme: localStorage.getItem('app-theme') || 'green',
      userProfile: JSON.parse(localStorage.getItem('user-profile') || 'null'),
      customExercises: JSON.parse(localStorage.getItem('custom-exercises') || '[]'),
      trainingPrograms: JSON.parse(localStorage.getItem('training-programs') || '[]'),
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

  const exportNutritionCSV = () => {
    const meals = JSON.parse(localStorage.getItem('meal-history') || '[]');
    const rows = ['Data,Hora,Tipo,Alimento,Calorias,Proteína(g),Carboidratos(g),Gordura(g)'];
    meals.forEach((m: any) => {
      m.items?.forEach((item: any) => {
        rows.push(`${m.date},${m.time},${m.type},${item.name},${item.calories},${item.protein},${item.carbs},${item.fat}`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitai-nutricao-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV de nutrição exportado!');
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
          if (data.waterGoal) localStorage.setItem('water-goal', JSON.stringify(data.waterGoal));
          if (data.measurements) localStorage.setItem('body-measurements', JSON.stringify(data.measurements));
          if (data.folders) localStorage.setItem('workout-folders', JSON.stringify(data.folders));
          if (data.theme) localStorage.setItem('app-theme', data.theme);
          if (data.userProfile) localStorage.setItem('user-profile', JSON.stringify(data.userProfile));
          if (data.customExercises) localStorage.setItem('custom-exercises', JSON.stringify(data.customExercises));
          if (data.trainingPrograms) localStorage.setItem('training-programs', JSON.stringify(data.trainingPrograms));
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
      'body-weight', 'water-log', 'water-goal', 'body-measurements', 'workout-folders',
      'user-profile', 'custom-exercises', 'training-programs',
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

  const saveProfile = () => {
    setProfile(tempProfile);
    setShowProfile(false);
    toast.success('Perfil salvo!');
  };

  const mealsCount = JSON.parse(localStorage.getItem('meal-history') || '[]').length;
  const weightCount = JSON.parse(localStorage.getItem('body-weight') || '[]').length;
  const customExCount = JSON.parse(localStorage.getItem('custom-exercises') || '[]').length;
  const hasMeasurements = Object.values(measurements).some(v => v !== '');
  const hasProfile = profile.height > 0 && profile.age > 0;

  return (
    <PageShell>
      <div className="pt-12 pb-36 space-y-6 max-w-lg mx-auto px-1">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform hover:bg-secondary/80">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Configurações</h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">Personalize seu app</p>
          </div>
        </div>

        {/* User Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <h3 className="font-black text-lg">Perfil Corporal</h3>
            </div>
            <button
              onClick={() => { setTempProfile(profile); setShowProfile(true); }}
              className="text-sm text-primary font-bold px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              {hasProfile ? 'Editar' : 'Configurar'}
            </button>
          </div>
          {hasProfile ? (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                <p className="text-lg font-black">{profile.height}cm</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Altura</p>
              </div>
              <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                <p className="text-lg font-black">{profile.age}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Idade</p>
              </div>
              <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                <p className="text-lg font-black">{profile.sex === 'male' ? 'M' : 'F'}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Sexo</p>
              </div>
              <div className="bg-secondary/80 rounded-xl p-3 text-center border border-border/30">
                <p className="text-lg font-black">{ACTIVITY_LABELS[profile.activityLevel]?.charAt(0)}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Atividade</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body bg-secondary/50 p-4 rounded-xl border border-border/30">Configure altura, idade e sexo para cálculos de composição corporal.</p>
          )}
        </motion.div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="card-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette size={20} className="text-primary" />
            </div>
            <h3 className="font-black text-lg">Tema de Cor</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`rounded-xl p-4 text-xs font-bold text-center transition-all active:scale-95 border ${
                  theme === t.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-border/30 bg-secondary/80 hover:bg-secondary'
                }`}
              >
                <div className="w-8 h-8 rounded-full mx-auto mb-2 shadow-inner" style={{ background: `hsl(${t.primary})` }} />
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Body Measurements */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="card-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ruler size={20} className="text-primary" />
              </div>
              <h3 className="font-black text-lg">Medidas Corporais</h3>
            </div>
            <button
              onClick={() => { setTempMeasurements(measurements); setShowMeasurements(true); }}
              className="text-sm text-primary font-bold px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              {hasMeasurements ? 'Editar' : 'Adicionar'}
            </button>
          </div>
          {hasMeasurements ? (
            <div className="grid grid-cols-3 gap-3">
              {MEASUREMENT_KEYS.filter(k => measurements[k.key]).map(({ key, label }) => (
                <div key={key} className="bg-secondary/80 border border-border/30 rounded-xl p-3 text-center">
                  <p className="text-lg font-black">{measurements[key]}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{label.split(' (')[0]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body bg-secondary/50 p-4 rounded-xl border border-border/30">Registre suas medidas para acompanhar evolução do corpo.</p>
          )}
          <button onClick={() => navigate('/peso')} className="w-full bg-secondary/80 border border-border/50 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:border-primary/30 mt-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-base font-bold">Peso Corporal</p>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">{weightCount} registros</p>
            </div>
          </button>
        </motion.div>

        {/* Export/Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download size={20} className="text-primary" />
            </div>
            <h3 className="font-black text-lg">Backup & Exportação</h3>
          </div>
          <p className="text-xs text-muted-foreground font-body px-1">Inclui treinos, refeições, peso corporal, medidas, perfil e configurações.</p>
          <div className="space-y-3 pt-1">
            <button onClick={exportJSON} className="w-full bg-secondary/80 border border-border/40 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:border-primary/30">
              <FileJson size={22} className="text-primary" />
              <div className="text-left">
                <p className="font-bold text-sm">Exportar Backup Completo (JSON)</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Todos os dados</p>
              </div>
            </button>
            <button onClick={exportCSV} className="w-full bg-secondary/80 border border-border/40 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:border-primary/30">
              <FileText size={22} className="text-primary" />
              <div className="text-left">
                <p className="font-bold text-sm">Exportar Treinos (CSV)</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Histórico de treinos para planilha</p>
              </div>
            </button>
            <button onClick={exportNutritionCSV} className="w-full bg-secondary/80 border border-border/40 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:border-primary/30">
              <FileText size={22} className="text-primary" />
              <div className="text-left">
                <p className="font-bold text-sm">Exportar Nutrição (CSV)</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Histórico de refeições para planilha</p>
              </div>
            </button>
            <button onClick={importJSON} className="w-full bg-secondary/80 border border-border/40 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:border-primary/30">
              <Upload size={22} className="text-primary" />
              <div className="text-left">
                <p className="font-bold text-sm">Importar Backup</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Restaurar todos os dados</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card-premium rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-lg">Resumo dos Dados</h3>
          <div className="space-y-3 text-sm font-bold text-muted-foreground pt-1 px-1">
            <div className="flex justify-between border-b border-border/30 pb-2"><span>Rotinas salvas</span><span className="text-foreground font-black">{templates.length}</span></div>
            <div className="flex justify-between border-b border-border/30 pb-2"><span>Treinos completados</span><span className="text-foreground font-black">{history.length}</span></div>
            <div className="flex justify-between border-b border-border/30 pb-2"><span>Recordes pessoais</span><span className="text-foreground font-black">{records.length}</span></div>
            <div className="flex justify-between border-b border-border/30 pb-2"><span>Metas ativas</span><span className="text-foreground font-black">{goals.length}</span></div>
            <div className="flex justify-between border-b border-border/30 pb-2"><span>Refeições registradas</span><span className="text-foreground font-black">{mealsCount}</span></div>
            <div className="flex justify-between border-b border-border/30 pb-2"><span>Registros de peso</span><span className="text-foreground font-black">{weightCount}</span></div>
            <div className="flex justify-between"><span>Exercícios personalizados</span><span className="text-foreground font-black">{customExCount}</span></div>
          </div>
        </motion.div>

        {/* Danger */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full bg-destructive/10 text-destructive rounded-2xl p-5 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform border border-destructive/20 hover:bg-destructive/20"
          >
            <Trash2 size={20} />
            <span className="font-black text-base">Limpar Todos os Dados</span>
          </button>
        </motion.div>
      </div>

      {/* Profile dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil Corporal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Altura (cm)</label>
                <input type="number" inputMode="numeric" placeholder="170" value={tempProfile.height || ''} onChange={e => setTempProfile(p => ({ ...p, height: parseInt(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Idade</label>
                <input type="number" inputMode="numeric" placeholder="25" value={tempProfile.age || ''} onChange={e => setTempProfile(p => ({ ...p, age: parseInt(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Sexo biológico</label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as const).map(s => (
                  <button key={s} onClick={() => setTempProfile(p => ({ ...p, sex: s }))} className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${tempProfile.sex === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {s === 'male' ? 'Masculino' : 'Feminino'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Nível de atividade</label>
              <div className="flex flex-wrap gap-1.5">
                {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map(a => (
                  <button key={a} onClick={() => setTempProfile(p => ({ ...p, activityLevel: a }))} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${tempProfile.activityLevel === a ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {ACTIVITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border/40 pt-3">
              <p className="text-xs text-muted-foreground font-body mb-2">Medidas para gordura corporal (Navy Method)</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-body">Pescoço (cm)</label>
                  <input type="number" inputMode="decimal" placeholder="38" value={tempProfile.neck || ''} onChange={e => setTempProfile(p => ({ ...p, neck: parseFloat(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-body">Cintura (cm)</label>
                  <input type="number" inputMode="decimal" placeholder="80" value={tempProfile.waist || ''} onChange={e => setTempProfile(p => ({ ...p, waist: parseFloat(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-body">Quadril (cm)</label>
                  <input type="number" inputMode="decimal" placeholder="95" value={tempProfile.hip || ''} onChange={e => setTempProfile(p => ({ ...p, hip: parseFloat(e.target.value) || 0 }))} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
            <button onClick={saveProfile} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm mt-2">Salvar Perfil</button>
          </div>
        </DialogContent>
      </Dialog>

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
