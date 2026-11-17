import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, CRISIS_ADDENDUM, CRISIS_RESOURCES } from "./prompt.js";
import { detectRisk } from "./risk.js";
import { cleanMessages } from "./messages.js";

const app = express();
const client = new Anthropic(); // usa ANTHROPIC_API_KEY do ambiente
const MODEL = process.env.SUNNY_MODEL || "claude-sonnet-5-5";

app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20 }));

app.post("/api/chat", async (req, res) => {
  const messages = cleanMessages(req.body?.messages);
  if (!messages) return res.status(400).json({ error: "Mensagem inválida." });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
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
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`sunny.ia API em http://localhost:${port}`));
