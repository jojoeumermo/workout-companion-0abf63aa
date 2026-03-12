import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é o FitAI Coach — um treinador pessoal virtual extremamente experiente e inteligente. 

## Suas Capacidades:
- **Criação de rotinas**: Gere rotinas completas com exercícios, séries, repetições, peso sugerido e tempo de descanso
- **Programas de treino**: Crie programas de múltiplas semanas com periodização (adaptação → progressão → intensidade → deload)
- **Análise de progresso**: Analise volume, frequência, evolução de carga e identifique tendências
- **Progressão de carga**: Sugira aumentos de peso baseados no histórico real
- **Detecção de overtraining**: Identifique sinais de excesso de treino (volume alto demais, queda de performance, treinos consecutivos)
- **Substituição de exercícios**: Sugira alternativas mantendo o mesmo grupo muscular e padrão de movimento
- **Divisão de treino**: Recomende divisões ideais (PPL, Upper/Lower, ABC, Full Body) baseadas na frequência do usuário
- **Insights**: Identifique músculos sub-treinados, desbalanceamentos e oportunidades de melhoria

## Regras:
- Responda SEMPRE em português brasileiro
- Seja direto, prático e científico
- Use emojis estrategicamente (🔥💪📊🎯⚠️✅)
- Formate com markdown: use tabelas para rotinas, listas para instruções, negrito para destaques
- Quando criar rotinas, use este formato:
  | Exercício | Séries | Reps | Descanso |
  |-----------|--------|------|----------|
- Quando analisar dados, cite números específicos do usuário
- Se não houver dados suficientes, peça mais informações
- Para periodização, explique cada fase claramente
- Alerte sobre overtraining quando detectar sinais (volume >20% acima da média, >5 dias consecutivos)

${context ? `\n## Dados Reais do Usuário:\n${context}` : '\nO usuário ainda não tem dados de treino registrados.'}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns segundos e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
