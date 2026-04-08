import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isDev = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const GEMINI_MODEL = "gemini-2.0-flash";
const OPENAI_MODEL = "gpt-4o-mini";

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function friendlyError(err: unknown): { message: string; status: number } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("API_KEY") || msg.includes("not configured") || msg.includes("API key not valid") || msg.includes("Incorrect API key")) {
    return { status: 500, message: "Chave da API inválida ou não configurada." };
  }
  if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("resource has been exhausted")) {
    return { status: 429, message: "Limite de requisições atingido. Aguarde 1 minuto e tente novamente." };
  }
  if (msg.includes("503") || msg.includes("502") || msg.toLowerCase().includes("unavailable")) {
    return { status: 503, message: "Serviço de IA temporariamente indisponível." };
  }
  return { status: 500, message: `Erro ao conectar com a IA: ${msg.slice(0, 200)}` };
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("resource") || msg.includes("limit: 0");
}

const COACH_SYSTEM = `Você é o FitAI Coach — um treinador pessoal virtual extremamente experiente e inteligente.

## Suas Capacidades:
- **Criação de rotinas**: Gere rotinas completas com exercícios, séries, repetições, peso sugerido e tempo de descanso
- **Programas de treino**: Crie programas de múltiplas semanas com periodização
- **Análise de progresso**: Analise volume, frequência, evolução de carga
- **Progressão de carga**: Sugira aumentos de peso baseados no histórico real
- **Detecção de overtraining**: Identifique sinais de excesso de treino
- **Substituição de exercícios**: Sugira alternativas mantendo o mesmo grupo muscular
- **Divisão de treino**: Recomende divisões ideais baseadas na frequência do usuário
- **Nutrição**: Dê conselhos sobre alimentação, macros e hidratação

## Regras:
- Responda SEMPRE em português brasileiro
- Seja direto, prático e científico
- Use emojis estrategicamente (🔥💪📊🎯⚠️✅)
- Formate com markdown: use tabelas para rotinas, listas para instruções, negrito para destaques
- Quando criar rotinas, use este formato:
  | Exercício | Séries | Reps | Descanso |
  |-----------|--------|------|----------|
- Quando analisar dados, cite números específicos do usuário
- Se não houver dados suficientes, peça mais informações`;

const MEAL_PROMPT_TEMPLATE = `Você é um nutricionista especialista. Analise a refeição e retorne APENAS um JSON válido (sem markdown, sem backticks, sem texto extra) com esta estrutura exata:
{
  "items": [{"name": "nome do alimento", "portion": "porção estimada", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}],
  "totals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
  "confidence": "alta|media|baixa",
  "tips": "dica nutricional curta"
}
Valores em gramas (exceto calorias em kcal). Seja preciso mas realista.`;

// Health check
app.get("/api/health", async (_req, res) => {
  const results: Record<string, string> = {};

  const gemini = getGemini();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
      const r = await model.generateContent("Diga apenas: OK");
      results.gemini = "ok: " + r.response.text().trim().slice(0, 20);
    } catch (err) {
      results.gemini = "error: " + (err instanceof Error ? err.message : String(err)).slice(0, 100);
    }
  } else {
    results.gemini = "no key";
  }

  const openai = getOpenAI();
  if (openai) {
    try {
      const r = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: "Diga apenas: OK" }],
        max_tokens: 10,
      });
      results.openai = "ok: " + (r.choices[0]?.message?.content || "").trim().slice(0, 20);
    } catch (err) {
      results.openai = "error: " + (err instanceof Error ? err.message : String(err)).slice(0, 100);
    }
  } else {
    results.openai = "no key";
  }

  const anyOk = Object.values(results).some(v => v.startsWith("ok"));
  res.status(anyOk ? 200 : 503).json({ status: anyOk ? "ok" : "degraded", providers: results });
});

// AI Coach - streaming endpoint with automatic fallback
app.post("/api/ai-coach", async (req, res) => {
  const { messages, context } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
    context?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Nenhuma mensagem fornecida." });
    return;
  }

  const systemContent = COACH_SYSTEM + (context
    ? `\n\n## Dados Reais do Usuário:\n${context}`
    : "\n\nO usuário ainda não tem dados de treino registrados.");

  const lastMessage = messages[messages.length - 1].content;

  // Try Gemini first
  const gemini = getGemini();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemContent,
      });
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }],
      }));
      const chat = model.startChat({ history });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const result = await chat.sendMessageStream(lastMessage);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err) {
      if (!isRateLimitError(err)) {
        console.error("[ai-coach][gemini]", err instanceof Error ? err.message : err);
      } else {
        console.log("[ai-coach] Gemini rate limited, falling back to OpenAI...");
      }
      if (res.headersSent) { res.end(); return; }
    }
  }

  // Fallback to OpenAI
  const openai = getOpenAI();
  if (openai) {
    try {
      const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemContent },
        ...messages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        stream: true,
        max_tokens: 2048,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err) {
      const { message, status } = friendlyError(err);
      console.error("[ai-coach][openai]", err instanceof Error ? err.message : err);
      if (!res.headersSent) {
        res.status(status).json({ error: message });
      } else {
        res.end();
      }
      return;
    }
  }

  res.status(503).json({ error: "Nenhum provedor de IA disponível. Configure GEMINI_API_KEY ou OPENAI_API_KEY." });
});

// Meal analysis endpoint with fallback
app.post("/api/analyze-meal", async (req, res) => {
  const { imageBase64, description } = req.body as { imageBase64?: string; description?: string };

  if (!imageBase64 && !description) {
    res.status(400).json({ error: "Envie uma imagem ou descrição da refeição" });
    return;
  }

  const mealDescription = description
    ? `Descrição: ${description}`
    : "Analise a imagem desta refeição.";

  const fullPrompt = MEAL_PROMPT_TEMPLATE + "\n\n" + mealDescription;

  // Try Gemini first
  const gemini = getGemini();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
      let result;
      if (imageBase64) {
        result = await model.generateContent([
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
          fullPrompt,
        ]);
      } else {
        result = await model.generateContent(fullPrompt);
      }
      const parsed = parseNutritionResponse(result.response.text());
      if (parsed) { res.json(parsed); return; }
    } catch (err) {
      if (!isRateLimitError(err)) {
        console.error("[analyze-meal][gemini]", err instanceof Error ? err.message : err);
      } else {
        console.log("[analyze-meal] Gemini rate limited, falling back to OpenAI...");
      }
    }
  }

  // Fallback to OpenAI
  const openai = getOpenAI();
  if (openai) {
    try {
      const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
      if (imageBase64) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" },
        });
      }
      contentParts.push({ type: "text", text: fullPrompt });

      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: contentParts }],
        max_tokens: 1024,
      });

      const text = result.choices[0]?.message?.content || "";
      const parsed = parseNutritionResponse(text);
      if (parsed) { res.json(parsed); return; }

      console.error("[analyze-meal][openai] Parse failed:", text.slice(0, 300));
      res.status(500).json({ error: "Não foi possível interpretar a análise. Tente descrever os alimentos." });
      return;
    } catch (err) {
      const { message, status } = friendlyError(err);
      console.error("[analyze-meal][openai]", err instanceof Error ? err.message : err);
      res.status(status).json({ error: message });
      return;
    }
  }

  res.status(503).json({ error: "Nenhum provedor de IA disponível. Configure GEMINI_API_KEY ou OPENAI_API_KEY." });
});

function parseNutritionResponse(content: string): any | null {
  try {
    let cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];
    const parsed = JSON.parse(cleaned);
    if (!parsed.items || !Array.isArray(parsed.items)) return null;
    if (!parsed.totals || typeof parsed.totals.calories !== 'number') {
      parsed.totals = {
        calories: parsed.items.reduce((s: number, i: any) => s + (i.calories || 0), 0),
        protein: parsed.items.reduce((s: number, i: any) => s + (i.protein || 0), 0),
        carbs: parsed.items.reduce((s: number, i: any) => s + (i.carbs || 0), 0),
        fat: parsed.items.reduce((s: number, i: any) => s + (i.fat || 0), 0),
        fiber: parsed.items.reduce((s: number, i: any) => s + (i.fiber || 0), 0),
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

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
  console.log(`Server running on port ${port} | Gemini: ${GEMINI_MODEL} | OpenAI: ${OPENAI_MODEL}`);
});
