import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isDev = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json({ limit: "15mb" }));

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurado. Adicione a chave da API do Gemini nas configurações do projeto (https://aistudio.google.com/apikey).");
  return new GoogleGenerativeAI(key);
}

function friendlyError(err: unknown): { message: string; status: number } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("API_KEY") || msg.includes("not configured")) {
    return { status: 500, message: msg };
  }
  if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
    return { status: 429, message: "Limite de requisições excedido. Aguarde alguns instantes e tente novamente." };
  }
  if (msg.includes("503") || msg.includes("502") || msg.toLowerCase().includes("unavailable")) {
    return { status: 503, message: "Serviço de IA temporariamente indisponível. Tente novamente em instantes." };
  }
  return { status: 500, message: `Erro ao conectar com a IA: ${msg.slice(0, 120)}` };
}

const COACH_SYSTEM = `Você é o FitAI Coach — um treinador pessoal virtual extremamente experiente e inteligente.

## Suas Capacidades:
- **Criação de rotinas**: Gere rotinas completas com exercícios, séries, repetições, peso sugerido e tempo de descanso
- **Programas de treino**: Crie programas de múltiplas semanas com periodização (adaptação → progressão → intensidade → deload)
- **Análise de progresso**: Analise volume, frequência, evolução de carga e identifique tendências
- **Progressão de carga**: Sugira aumentos de peso baseados no histórico real
- **Detecção de overtraining**: Identifique sinais de excesso de treino
- **Substituição de exercícios**: Sugira alternativas mantendo o mesmo grupo muscular
- **Divisão de treino**: Recomende divisões ideais baseadas na frequência do usuário
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
- Alerte sobre overtraining quando detectar sinais (volume >20% acima da média, >5 dias consecutivos)`;

// AI Coach - streaming endpoint
app.post("/api/ai-coach", async (req, res) => {
  try {
    const genAI = getGemini();
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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemContent,
    });

    // Convert message history to Gemini format
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;

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
  } catch (err: unknown) {
    const { message, status } = friendlyError(err);
    console.error(`[ai-coach] ${status}:`, message);
    if (!res.headersSent) {
      res.status(status).json({ error: message });
    } else {
      res.end();
    }
  }
});

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate");
      if (isRateLimit && attempt < maxRetries) {
        const delay = (attempt + 1) * 2000; // 2s, 4s
        console.log(`[rate-limit] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Meal analysis endpoint
app.post("/api/analyze-meal", async (req, res) => {
  try {
    const genAI = getGemini();
    const { imageBase64, description } = req.body as { imageBase64?: string; description?: string };

    if (!imageBase64 && !description) {
      res.status(400).json({ error: "Envie uma imagem ou descrição da refeição" });
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Você é um nutricionista especialista. Analise a refeição e retorne APENAS um JSON válido (sem markdown, sem backticks) com esta estrutura exata:
{
  "items": [{"name": "nome do alimento", "portion": "porção estimada", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}],
  "totals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
  "confidence": "alta|media|baixa",
  "tips": "dica nutricional curta"
}
Valores em gramas (exceto calorias em kcal). Seja preciso mas realista.

${description ? `Descrição: ${description}` : "Analise a imagem desta refeição."}`;

    const result = await withRetry(() => {
      if (imageBase64) {
        return model.generateContent([
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
          prompt,
        ]);
      }
      return model.generateContent(prompt);
    });

    const content = result.response.text();
    let parsed;
    try {
      // Strip markdown code blocks
      let cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      // Extract JSON object if there's surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      parsed = JSON.parse(cleaned);
      // Validate required structure
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error("Missing items array in response");
      }
      if (!parsed.totals || typeof parsed.totals.calories !== 'number') {
        // Recalculate totals from items if missing
        parsed.totals = {
          calories: parsed.items.reduce((s: number, i: any) => s + (i.calories || 0), 0),
          protein: parsed.items.reduce((s: number, i: any) => s + (i.protein || 0), 0),
          carbs: parsed.items.reduce((s: number, i: any) => s + (i.carbs || 0), 0),
          fat: parsed.items.reduce((s: number, i: any) => s + (i.fat || 0), 0),
          fiber: parsed.items.reduce((s: number, i: any) => s + (i.fiber || 0), 0),
        };
      }
    } catch {
      console.error("Failed to parse AI response:", content.slice(0, 500));
      res.status(500).json({ error: "Não foi possível interpretar a análise. Tente tirar uma foto mais clara ou descreva os alimentos manualmente." });
      return;
    }

    res.json(parsed);
  } catch (err: unknown) {
    const { message, status } = friendlyError(err);
    console.error(`[analyze-meal] ${status}:`, message);
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
  console.log(`Server running on port ${port}`);
});
