import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SYSTEM_PROMPT, CRISIS_ADDENDUM, CRISIS_RESOURCES } from "../prompt.js";
import { detectRisk } from "../risk.js";
import { cleanMessages } from "../messages.js";

const client = new Anthropic(); // usa ANTHROPIC_API_KEY do ambiente
const MODEL = process.env.SUNNY_MODEL || "claude-sonnet-5-5";

// Rate limit compartilhado entre as instâncias (Upstash Redis).
// Sem as variáveis do Upstash, o limite fica desligado.
const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
const redis = hasRedis ? Redis.fromEnv() : null;
const perMinute = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "sunny:min" })
  : null;
const perDay = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, "1 d"), prefix: "sunny:day" })
  : null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (perMinute) {
    try {
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
      const [min, day] = await Promise.all([perMinute.limit(ip), perDay.limit(ip)]);
      if (!min.success || !day.success) {
        return res.status(429).json({ error: "Muitas mensagens. Tente de novo em instantes." });
      }
    } catch (err) {
      console.error("Falha no rate limit:", err.message); // segue sem limitar
    }
  }

  const messages = cleanMessages(req.body?.messages);
  if (!messages) return res.status(400).json({ error: "Mensagem inválida." });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const risky = await detectRisk(client, messages);
    if (risky) send({ text: CRISIS_RESOURCES + "\n\n" });

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 800,
      system: risky ? SYSTEM_PROMPT + CRISIS_ADDENDUM : SYSTEM_PROMPT,
      messages,
    });
    stream.on("text", (text) => send({ text }));
    await stream.finalMessage();
  } catch (err) {
    // não registra o conteúdo das conversas, só o erro
    console.error("Erro no chat:", err.status ?? "", err.message);
    send({ error: "A Sunny está com dificuldade agora. Tente de novo em instantes." });
  }

  res.write("data: [DONE]\n\n");
  res.end();
}
