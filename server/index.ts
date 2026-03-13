import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isDev = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const SYSTEM_PROMPT = `Você é o FitAI Coach — um treinador pessoal virtual extremamente experiente e inteligente. 

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
- Alerte sobre overtraining quando detectar sinais (volume >20% acima da média, >5 dias consecutivos)`;

function friendlyErrorMessage(err: unknown): { message: string; status: number } {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      const isQuota = String(err.message).includes("quota") || String(err.message).includes("insufficient_quota");
      if (isQuota) {
        return {
          status: 402,
          message: "Cota da API OpenAI esgotada. Adicione créditos em platform.openai.com/settings/billing para continuar usando o FitAI Coach.",
        };
      }
      return {
        status: 429,
        message: "Muitas requisições. Aguarde alguns segundos e tente novamente.",
      };
    }
    if (err.status === 401) {
      return {
        status: 401,
        message: "Chave da API OpenAI inválida. Verifique a configuração do OPENAI_API_KEY.",
      };
    }
    if (err.status === 503 || err.status === 502) {
      return {
        status: 503,
        message: "Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.",
      };
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return {
    status: 500,
    message: `Erro ao conectar com a IA: ${msg.slice(0, 120)}`,
  };
}

app.post("/api/ai-coach", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY não configurado. Adicione a chave de API nas configurações do projeto." });
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { messages, context } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      context?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Nenhuma mensagem fornecida." });
      return;
    }

    const systemContent =
      SYSTEM_PROMPT +
      (context
        ? `\n\n## Dados Reais do Usuário:\n${context}`
        : "\n\nO usuário ainda não tem dados de treino registrados.");

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [{ role: "system", content: systemContent }, ...messages],
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`);
      }
      if (chunk.choices[0]?.finish_reason) {
        res.write("data: [DONE]\n\n");
      }
    }
    res.end();
  } catch (err: unknown) {
    const { message, status } = friendlyErrorMessage(err);
    console.error(`[ai-coach] ${status}:`, message);
    if (!res.headersSent) {
      res.status(status).json({ error: message });
    } else {
      res.end();
    }
  }
});

if (isDev) {
  app.use(
    "/",
    createProxyMiddleware({
      target: "http://localhost:5173",
      changeOrigin: true,
      ws: true,
    })
  );
} else {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const port = parseInt(process.env.PORT || "5000");
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
