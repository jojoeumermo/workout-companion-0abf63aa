import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isDev = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const GEMINI_MODEL = "gemini-1.5-flash";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 2000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("502") || msg.toLowerCase().includes("timeout");
      if (isRetryable && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.log(`[retry] Attempt ${attempt + 1}/${maxRetries}, waiting ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function getGemini(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada.");
  return new GoogleGenerativeAI(key);
}

function friendlyError(err: unknown): { message: string; status: number } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("API_KEY") || msg.includes("API key") || msg.includes("not configured") || msg.includes("não configurada")) {
    return { status: 500, message: "Chave da API inválida ou não configurada. Verifique a GEMINI_API_KEY." };
  }
  if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
    return { status: 429, message: "Limite de requisições atingido. Aguarde 1 minuto e tente novamente." };
  }
  if (msg.includes("503") || msg.includes("502") || msg.toLowerCase().includes("unavailable")) {
    return { status: 503, message: "Serviço de IA temporariamente indisponível." };
  }
  return { status: 500, message: `Erro ao conectar com a IA: ${msg.slice(0, 200)}` };
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

const MEAL_PROMPT = `Você é um nutricionista especialista. Analise a refeição e retorne APENAS um JSON válido (sem markdown, sem backticks, sem texto extra) com esta estrutura exata:
{
  "items": [{"name": "nome do alimento", "portion": "porção estimada", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}],
  "totals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
  "confidence": "alta|media|baixa",
  "tips": "dica nutricional curta"
}
Valores em gramas (exceto calorias em kcal). Seja preciso mas realista.`;

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent("Diga apenas: OK");
    const response = result.response.text().trim();
    res.json({ status: "ok", model: GEMINI_MODEL, response });
  } catch (err) {
    const { message, status } = friendlyError(err);
    console.error("[health]", err instanceof Error ? err.message : err);
    res.status(status).json({ status: "error", error: message });
  }
});

// AI Coach - streaming SSE
app.post("/api/ai-coach", async (req, res) => {
  const { messages, context } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
    context?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Nenhuma mensagem fornecida." });
    return;
  }

  try {
    const genAI = getGemini();

    const systemContent = COACH_SYSTEM + (context
      ? `\n\n## Dados Reais do Usuário:\n${context}`
      : "\n\nO usuário ainda não tem dados de treino registrados.");

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemContent,
    });

    // All messages except the last become history; last message is sent now
    const history: Content[] = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const streamResult = await chat.sendMessageStream(lastMessage);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const { message, status } = friendlyError(err);
    console.error("[ai-coach]", err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      res.status(status).json({ error: message });
    } else {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n❌ ${message}` } }] })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

// Meal analysis (vision)
app.post("/api/analyze-meal", async (req, res) => {
  const { imageBase64, description } = req.body as { imageBase64?: string; description?: string };

  if (!imageBase64 && !description) {
    res.status(400).json({ error: "Envie uma imagem ou descrição da refeição" });
    return;
  }

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const parts: (string | { inlineData: { data: string; mimeType: string } })[] = [];

    if (imageBase64) {
      parts.push({ inlineData: { data: imageBase64, mimeType: "image/jpeg" } });
    }

    const mealDescription = description ? `Descrição: ${description}` : "Analise a imagem desta refeição.";
    parts.push(MEAL_PROMPT + "\n\n" + mealDescription);

    const result = await withRetry(() => model.generateContent(parts));
    const text = result.response.text();

    const parsed = parseNutritionResponse(text);
    if (parsed) {
      res.json(parsed);
    } else {
      console.error("[analyze-meal] Parse failed:", text.slice(0, 300));
      res.status(500).json({ error: "Não foi possível interpretar a análise. Tente descrever os alimentos." });
    }
  } catch (err) {
    const { message, status } = friendlyError(err);
    console.error("[analyze-meal]", err instanceof Error ? err.message : err);
    res.status(status).json({ error: message });
  }
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

// Post-workout AI analysis (non-streaming)
app.post("/api/analyze-workout", async (req, res) => {
  const { workout, previousWorkout, prs } = req.body as {
    workout: {
      name: string;
      duration: number;
      totalVolume: number;
      exercises: { name: string; muscle: string; sets: { weight: number; reps: number }[] }[];
    };
    previousWorkout?: {
      name: string;
      totalVolume: number;
      exercises: { name: string; sets: { weight: number; reps: number }[] }[];
    };
    prs?: { exerciseName: string; type: string; value: string }[];
  };

  if (!workout) {
    res.status(400).json({ error: "Dados do treino ausentes." });
    return;
  }

  const prompt = `Analise este treino concluído e gere um resumo inteligente em português brasileiro.

Treino atual: ${workout.name}
Duração: ${Math.round(workout.duration / 60)} minutos
Volume total: ${workout.totalVolume}kg
Exercícios: ${workout.exercises.map(e => `${e.name} (${e.muscle}): ${e.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}`).join(' | ')}
${prs && prs.length > 0 ? `Recordes batidos: ${prs.map(p => `${p.exerciseName} - ${p.type}: ${p.value}`).join(', ')}` : ''}
${previousWorkout ? `Treino anterior (${previousWorkout.name}): volume ${previousWorkout.totalVolume}kg | ${previousWorkout.exercises.map(e => `${e.name}: ${e.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}`).join(' | ')}` : 'Sem treino anterior para comparação.'}

Gere um resumo com:
1. Uma frase de abertura motivacional e direta (1 linha)
2. **Destaques do treino** (2-3 pontos, use ✅)  
3. **Comparação com treino anterior** (se disponível, use 📈 ou 📉)
4. **Recomendação para o próximo treino** (1-2 pontos, use 🎯)

Seja conciso (máx 150 palavras), direto e específico com os números. Use markdown.`;

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: "Você é um treinador pessoal expert. Analise treinos e dê feedback conciso, motivador e baseado em dados. Responda sempre em português brasileiro.",
    });

    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text();
    res.json({ analysis: text });
  } catch (err) {
    const { message, status } = friendlyError(err);
    console.error("[analyze-workout]", err instanceof Error ? err.message : err);
    res.status(status).json({ error: message });
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
  console.log(`Server running on port ${port} | Model: ${GEMINI_MODEL}`);
});
