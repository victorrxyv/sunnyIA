const RISK_MODEL = process.env.SUNNY_RISK_MODEL || "claude-haiku-5-5";

const INSTRUCTION = `Você analisa conversas de apoio emocional. Responda SOMENTE com JSON.
{"risco":"alto"} se a pessoa expressa ideias de suicídio, desejo de morrer, intenção de se machucar ou perigo imediato (para si ou para outros).
Caso contrário: {"risco":"nenhum"}.`;

export async function detectRisk(client, messages) {
  try {
    const transcript = messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Pessoa" : "Sunny"}: ${m.content}`)
      .join("\n");

    const res = await client.messages.create({
      model: RISK_MODEL,
      max_tokens: 30,
      system: INSTRUCTION,
      messages: [{ role: "user", content: transcript }],
    });

    const text = res.content.find((b) => b.type === "text")?.text ?? "";
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(json).risco === "alto";
  } catch (err) {
    console.error("Falha na triagem de risco:", err.message);
    return false; // o system prompt principal também trata situações de crise
  }
}
