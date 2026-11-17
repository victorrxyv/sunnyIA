import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SYSTEM_PROMPT, CRISIS_ADDENDUM, CRISIS_RESOURCES, EMPTY_REPLY } from "../prompt.js";
import { detectRisk, keywordRisk } from "../risk.js";
import { cleanMessages } from "../messages.js";
import { streamGenerate, CHAT_MODEL } from "../gemini.js";

// Rate limit compartilhado entre as instâncias (Upstash Redis).
// Sem as variáveis do Upstash, o limite fica desligado.
const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
const redis = hasRedis ? Redis.fromEnv() : null;
const perMinute = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(6, "1 m"), prefix: "sunny:min" })
  : null;
const perDay = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 d"), prefix: "sunny:day" })
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
  // Triagem e resposta rodam ao mesmo tempo: o texto só espera a triagem se ela
  // ainda não terminou, então o tempo total é o do mais lento, não a soma.
  let closed = false;
  const send = (data) => {
    if (!closed) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const t0 = Date.now();
  let tRisk = 0;
  let tFirst = 0;
  const quick = keywordRisk(messages);
  const riskPromise = quick ? Promise.resolve(true) : detectRisk(messages);
  const pending = [];
  let decided = false;
  riskPromise.then((risky) => {
    tRisk = Date.now() - t0;
    decided = true;
    if (risky) send({ text: CRISIS_RESOURCES + "\n\n" });
    pending.splice(0).forEach((text) => send({ text }));
  });

  try {
    const total = await streamGenerate({
      model: CHAT_MODEL,
      system: quick ? SYSTEM_PROMPT + CRISIS_ADDENDUM : SYSTEM_PROMPT,
      messages,
      onText: (text) => {
        if (!tFirst) tFirst = Date.now() - t0;
        decided ? send({ text }) : pending.push(text);
      },
    });
    await riskPromise;
    console.log(`[chat] triagem ${tRisk}ms, primeiro texto ${tFirst}ms, total ${Date.now() - t0}ms`);
    if (!total) send({ text: EMPTY_REPLY });
  } catch (err) {
    // não registra o conteúdo das conversas, só o erro
    console.error(`Erro no chat (${Date.now() - t0}ms):`, err.message);
    await riskPromise;
    send({ error: "A Sunny está com dificuldade agora. Tente de novo em instantes." });
  }

  closed = true;
  res.write("data: [DONE]\n\n");
  res.end();
}
