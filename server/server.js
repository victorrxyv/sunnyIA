import "dotenv/config";
import express from "express";
import path from "node:path";
import rateLimit from "express-rate-limit";
import { SYSTEM_PROMPT, CRISIS_ADDENDUM, CRISIS_RESOURCES, EMPTY_REPLY } from "./prompt.js";
import { detectRisk, keywordRisk } from "./risk.js";
import { cleanMessages } from "./messages.js";
import { streamGenerate, CHAT_MODEL } from "./gemini.js";

const app = express();

app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 10 }));

app.post("/api/chat", async (req, res) => {
  const messages = cleanMessages(req.body?.messages);
  if (!messages) return res.status(400).json({ error: "Mensagem inválida." });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
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
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  // rotas do React Router (/chat, /sobre) caem no index.html
  app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`sunny.ia API em http://localhost:${port}`));
