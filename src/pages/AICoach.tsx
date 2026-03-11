import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Dumbbell, TrendingUp, Zap, ArrowLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import PageShell from '@/components/PageShell';
import { useHistory, usePersonalRecords, useTemplates } from '@/hooks/useStorage';
import { getExerciseById } from '@/data/exercises';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_PROMPTS = [
  { icon: Dumbbell, label: 'Substituir exercício', prompt: 'Qual exercício posso usar para substituir o supino reto com barra?' },
  { icon: TrendingUp, label: 'Progressão de carga', prompt: 'Me dê dicas de como progredir carga no agachamento de forma segura.' },
  { icon: Zap, label: 'Gerar rotina', prompt: 'Crie uma rotina de treino Push/Pull/Legs para hipertrofia, 6 dias por semana.' },
  { icon: Sparkles, label: 'Analisar treino', prompt: 'Analise meu histórico de treinos recente e sugira melhorias.' },
];

export default function AICoach() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [history] = useHistory();
  const { records } = usePersonalRecords();
  const [templates] = useTemplates();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Build context from user data
  const buildContext = () => {
    const parts: string[] = [];

    // Recent workouts
    const recentWorkouts = history.slice(-5).reverse();
    if (recentWorkouts.length > 0) {
      parts.push('Últimos treinos:');
      recentWorkouts.forEach(w => {
        const date = new Date(w.completedAt).toLocaleDateString('pt-BR');
        const exercises = w.exercises.map(e => {
          const ex = getExerciseById(e.exerciseId);
          const sets = e.sets.filter(s => s.completed).map(s => `${s.weight}kg×${s.reps}`).join(', ');
          return `${ex?.name || 'Exercício'}: ${sets}`;
        }).join('; ');
        parts.push(`- ${w.name} (${date}, ${Math.round(w.duration / 60)}min, ${w.totalVolume}kg vol): ${exercises}`);
      });
    }

    // Personal records
    if (records.length > 0) {
      parts.push('\nRecordes pessoais:');
      records.slice(0, 10).forEach(r => {
        const ex = getExerciseById(r.exerciseId);
        parts.push(`- ${ex?.name || 'Exercício'}: ${r.maxWeight}kg peso, ${r.maxReps} reps, ${r.maxVolume}kg vol`);
      });
    }

    // Templates
    if (templates.length > 0) {
      parts.push('\nRotinas do usuário:');
      templates.forEach(t => {
        const exNames = t.exercises.map(e => getExerciseById(e.exerciseId)?.name || '?').join(', ');
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

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            context,
          }),
        }
      );

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

      // Final flush
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
      console.error('AI chat error:', e);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `❌ ${e instanceof Error ? e.message : 'Erro ao conectar com a IA. Tente novamente.'}` },
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

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <PageShell title="FitAI Coach" rightAction={
      messages.length > 0 ? (
        <button onClick={clearChat} className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
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
            className="flex-1 flex flex-col items-center justify-center space-y-6 py-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot size={36} className="text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">FitAI Coach</h2>
              <p className="text-muted-foreground font-body text-sm max-w-xs mx-auto">
                Seu assistente de treino inteligente. Pergunte sobre exercícios, progressão ou peça para criar rotinas.
              </p>
            </div>

            <div className="w-full space-y-2">
              {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="w-full bg-card rounded-xl p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform hover:bg-secondary"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground font-body truncate">{prompt}</p>
                  </div>
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
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:text-sm [&_p]:font-body [&_li]:text-sm [&_li]:font-body [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm font-body">{msg.content}</p>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
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
    </PageShell>
  );
}
