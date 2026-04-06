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

app.post("/api/analyze-meal", async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY não configurado." });
    return;
  }

  try {
    const { imageBase64, description } = req.body as { imageBase64?: string; description?: string };

    if (!imageBase64 && !description) {
      res.status(400).json({ error: "Envie uma imagem ou descrição da refeição" });
      return;
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const systemMessage = {
      role: "system" as const,
      content: `Você é um nutricionista especialista. Analise a refeição e retorne APENAS um JSON válido (sem markdown, sem backticks) com esta estrutura exata:
{
  "items": [{"name": "nome do alimento", "portion": "porção estimada", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}],
  "totals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
  "confidence": "alta|media|baixa",
  "tips": "dica nutricional curta"
}
Valores em gramas (exceto calorias em kcal). Se não conseguir identificar, estime com base na descrição. Seja preciso mas realista.`,
    };

    const userContent: any[] = [];
    if (description) userContent.push({ type: "text", text: `Analise esta refeição e estime os macronutrientes: ${description}` });
    if (imageBase64) {
      if (!description) userContent.push({ type: "text", text: "Analise esta refeição e estime os macronutrientes." });
      userContent.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, { role: "user", content: userContent }],
    });

    const content = completion.choices[0]?.message?.content || "";
    let parsed;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      res.status(500).json({ error: "Não foi possível processar a análise. Tente novamente." });
      return;
    }

    res.json(parsed);
  } catch (err: unknown) {
    const { message, status } = friendlyErrorMessage(err);
    console.error(`[analyze-meal] ${status}:`, message);
    res.status(status).json({ error: message });
  }
});

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
