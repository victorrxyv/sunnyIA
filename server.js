import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { SYSTEM_PROMPT, CRISIS_ADDENDUM, CRISIS_RESOURCES, EMPTY_REPLY } from "./prompt.js";
import { detectRisk } from "./risk.js";
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
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const risky = await detectRisk(messages);
    if (risky) send({ text: CRISIS_RESOURCES + "\n\n" });

    const total = await streamGenerate({
      model: CHAT_MODEL,
      system: risky ? SYSTEM_PROMPT + CRISIS_ADDENDUM : SYSTEM_PROMPT,
      messages,
      onText: (text) => send({ text }),
    });
    if (!total) send({ text: EMPTY_REPLY });
  } catch (err) {
    // não registra o conteúdo das conversas, só o erro
    console.error("Erro no chat:", err.message);
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
