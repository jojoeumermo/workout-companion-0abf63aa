import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Dumbbell, TrendingUp, Zap, Trash2, Target, Brain, AlertTriangle, Calendar, BookOpen, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import PageShell from '@/components/PageShell';
import { apiFetch } from '@/lib/api';
import { useHistory, usePersonalRecords, useTemplates, useBodyWeight } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { buildWorkoutContextForAI, detectStagnation, detectOvertraining, getWeeklyStats } from '@/lib/workoutAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { haptic } from '@/lib/haptic';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_PROMPTS = [
  { icon: Dumbbell, label: 'Criar rotina', prompt: 'Com base no meu histórico real de treinos e grupos musculares que já trabalho, crie uma nova rotina de treino personalizada. Inclua exercícios, séries, reps e descanso em formato de tabela.' },
  { icon: TrendingUp, label: 'Analisar semana', prompt: 'Faça uma análise completa dos meus treinos desta semana: distribuição muscular, volume, frequência, qualidade e o que melhorar na próxima semana.' },
  { icon: Zap, label: 'Substituições', prompt: 'Baseado nos exercícios que faço atualmente, sugira alternativas equivalentes para cada um — com o mesmo grupo muscular mas equipamentos diferentes ou variações melhores.' },
  { icon: Target, label: 'Progressão de carga', prompt: 'Analise os exercícios em que há estagnação ou progressão no meu histórico. Para cada um, sugira uma estratégia específica de progressão de carga para as próximas 4 semanas.' },
  { icon: Brain, label: 'Programa 8 semanas', prompt: 'Crie um programa completo de 8 semanas com periodização baseado no meu nível e histórico. Inclua fases de adaptação, volume e intensidade com tabelas detalhadas.' },
  { icon: AlertTriangle, label: 'Risco overtraining', prompt: 'Analise meu volume total, frequência, grupos musculares e dias de descanso. Estou em risco de overtraining? O que devo ajustar imediatamente?' },
  { icon: Calendar, label: 'Divisão semanal', prompt: 'Com base nos treinos que já fiz e meus músculos mais e menos trabalhados, qual a melhor divisão de treino para a minha semana? Justifique cada dia.' },
  { icon: Sparkles, label: 'Previsão de evolução', prompt: 'Com base na minha progressão de carga histórica nos principais exercícios, estime minha evolução nas próximas 4-8 semanas e dê recomendações para acelerar os ganhos.' },
];

function isProgramLikeContent(content: string): boolean {
  const lower = content.toLowerCase();
  const keywords = ['semana', 'programa', 'rotina', 'divisão', 'periodiza', 'peito', 'costas', 'perna', 'ombro'];
  const hasKeywords = keywords.filter(k => lower.includes(k)).length >= 2;
  const hasTable = content.includes('|') || content.includes('##') || content.includes('**Dia');
  const isLong = content.length > 400;
  return (hasKeywords && isLong) || hasTable;
}

function saveProgram(name: string, goal: string, weeks: number, content: string) {
  try {
    const existing = JSON.parse(localStorage.getItem('training-programs') || '[]');
    const program = {
      id: `prog-${Date.now()}`,
      name,
      weeks,
      goal,
      level: 'Personalizado',
      daysPerWeek: 4,
      description: content.slice(0, 400).replace(/[#*|]/g, '').trim() + '...',
      schedule: [],
      currentWeek: 0,
      status: 'available',
    };
    localStorage.setItem('training-programs', JSON.stringify([...existing, program]));
    return true;
  } catch {
    return false;
  }
}

export default function AICoach() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTargetIdx, setSaveTargetIdx] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveGoal, setSaveGoal] = useState('Hipertrofia');
  const [saveWeeks, setSaveWeeks] = useState(8);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [history] = useHistory();
  const { records } = usePersonalRecords();
  const [templates] = useTemplates();
  const { entries: weightEntries } = useBodyWeight();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const buildContext = () => {
    const parts: string[] = [];

    const richContext = buildWorkoutContextForAI(history);
    parts.push(richContext);

    if (records.length > 0) {
      parts.push('\nRecordes pessoais (PRs):');
      records
        .map(r => ({ ...r, ex: getExerciseById(r.exerciseId) }))
        .filter(r => r.ex)
        .sort((a, b) => b.maxWeight - a.maxWeight)
        .forEach(r => {
          parts.push(`- ${r.ex!.name} [${r.ex!.muscleGroup}]: ${r.maxWeight}kg, ${r.maxReps} reps, vol ${r.maxVolume}kg (${new Date(r.date).toLocaleDateString('pt-BR')})`);
        });
    }

    const muscleVol: Record<string, number> = {};
    history.forEach(w => w.exercises.forEach(e => {
      const ex = getExerciseById(e.exerciseId);
      if (ex) {
        const vol = e.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0);
        muscleVol[ex.muscleGroup] = (muscleVol[ex.muscleGroup] || 0) + vol;
      }
    }));
    if (Object.keys(muscleVol).length > 0) {
      parts.push('\nVolume total acumulado por músculo:');
      Object.entries(muscleVol).sort(([,a],[,b]) => b - a).forEach(([m, v]) => {
        parts.push(`- ${m}: ${(v / 1000).toFixed(1)}t`);
      });
    }

    if (history.length >= 3) {
      const stagnation = detectStagnation(history, 3);
      if (stagnation.length > 0) {
        parts.push('\nExercícios com estagnação detectada (sem progressão de carga):');
        stagnation.forEach(s => {
          parts.push(`- ${s.exerciseName}: ${s.workoutCount} treinos em ${s.avgWeight}kg`);
        });
      }

      const ot = detectOvertraining(history);
      if (ot.risk !== 'low') {
        parts.push(`\nRisco de overtraining: ${ot.risk.toUpperCase()}`);
        parts.push('Motivos: ' + ot.reasons.join('; '));
        if (ot.suggestions.length > 0) parts.push('Sugestões: ' + ot.suggestions.join('; '));
      }

      const weeklyStats = getWeeklyStats(history);
      if (weeklyStats.totalWorkouts > 0) {
        parts.push(`\nEstatísticas da semana atual: ${weeklyStats.totalWorkouts} treinos, ${weeklyStats.totalVolume}kg volume, ${Math.round(weeklyStats.avgDuration / 60)}min duração média`);
        const muscleKeys = Object.keys(weeklyStats.muscleDistribution || {});
        if (muscleKeys.length > 0) {
          parts.push('Músculos treinados esta semana: ' + muscleKeys.join(', '));
        }
      }
    }

    if (weightEntries.length > 0) {
      const recent = weightEntries.slice(-5);
      const trend = recent.length >= 2 ? (recent[recent.length - 1].weight - recent[0].weight).toFixed(1) : null;
      parts.push(`\nPeso corporal: atual ${recent[recent.length - 1].weight}kg${trend ? `, tendência ${Number(trend) >= 0 ? '+' : ''}${trend}kg nos últimos registros` : ''}`);
    }

    if (templates.length > 0) {
      parts.push('\nRotinas salvas do usuário:');
      templates.forEach(t => {
        const exNames = t.exercises.map(e => {
          const ex = getExerciseById(e.exerciseId);
          return `${ex?.name} (${e.sets.length}×${e.sets[0]?.targetReps || 10})`;
        }).join(', ');
        parts.push(`- ${t.name}: ${exNames}`);
      });
    }

    return parts.join('\n');
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Msg = { role: 'user', content: content.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const context = buildContext();

      const resp = await apiFetch('/api/ai-coach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            context,
          }),
        });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao conectar com a IA.';
      console.error('AI chat error:', msg);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `❌ **Erro:** ${msg}\n\nTente novamente em alguns instantes.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const openSaveDialog = (idx: number) => {
    setSaveTargetIdx(idx);
    setSaveName(`Programa FitAI — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`);
    setShowSaveDialog(true);
  };

  const handleSaveProgram = () => {
    if (!saveName.trim()) { toast.error('Nome obrigatório'); return; }
    const content = saveTargetIdx !== null ? messages[saveTargetIdx]?.content || '' : '';
    const ok = saveProgram(saveName.trim(), saveGoal, saveWeeks, content);
    if (ok) {
      if (saveTargetIdx !== null) setSavedIndices(prev => new Set([...prev, saveTargetIdx]));
      setShowSaveDialog(false);
      haptic('success');
      toast.success('Programa salvo! Acesse na aba Programas.');
    } else {
      toast.error('Erro ao salvar programa');
    }
  };

  return (
    <PageShell title="FitAI Coach" rightAction={
      messages.length > 0 ? (
        <button onClick={() => { setMessages([]); setSavedIndices(new Set()); }} className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
          <Trash2 size={18} />
        </button>
      ) : undefined
    }>
      <div className="max-w-lg mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Empty State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-6 py-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot size={36} className="text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">FitAI Coach</h2>
              <p className="text-muted-foreground font-body text-sm max-w-xs mx-auto">
                Treinador inteligente que analisa seus dados reais. Pergunte qualquer coisa sobre treino!
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="bg-card rounded-xl p-3 flex items-center gap-2.5 text-left active:scale-[0.98] transition-transform hover:bg-secondary"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <p className="font-medium text-xs leading-tight">{label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-4 py-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 max-w-[85%] space-y-2">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-card'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:text-sm [&_p]:font-body [&_li]:text-sm [&_li]:font-body [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm font-body">{msg.content}</p>
                      )}
                    </div>

                    {/* Save as program button for AI messages */}
                    {msg.role === 'assistant' && !isLoading && isProgramLikeContent(msg.content) && (
                      <div className="flex">
                        {savedIndices.has(i) ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20">
                            <Check size={12} /> Programa Salvo!
                          </div>
                        ) : (
                          <button
                            onClick={() => openSaveDialog(i)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20 active:scale-95 transition-transform hover:bg-primary/20"
                          >
                            <BookOpen size={12} /> Salvar como Programa
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="bg-card rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-20 bg-background pt-2 pb-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre treino..."
              rows={1}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring font-body text-sm resize-none max-h-32"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Save as Program Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Salvar como Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-xs text-muted-foreground font-body">O programa será salvo na aba Programas e você poderá ativá-lo quando quiser.</p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-body">Nome do programa</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Duração (semanas)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={saveWeeks}
                  onChange={e => setSaveWeeks(parseInt(e.target.value) || 4)}
                  className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">Objetivo</label>
                <select
                  value={saveGoal}
                  onChange={e => setSaveGoal(e.target.value)}
                  className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {['Hipertrofia', 'Força', 'Resistência', 'Emagrecimento', 'Saúde'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveProgram}
              disabled={!saveName.trim()}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <BookOpen size={16} /> Salvar Programa
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
