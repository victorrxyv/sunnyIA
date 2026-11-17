import { generate, RISK_MODEL } from "./gemini.js";

const INSTRUCTION = `Você analisa conversas de apoio emocional. Responda SOMENTE com JSON.
{"risco":"alto"} se a pessoa expressa ideias de suicídio, desejo de morrer, intenção de se machucar ou perigo imediato (para si ou para outros).
Caso contrário: {"risco":"nenhum"}.`;

// Rede de segurança: funciona mesmo se o modelo falhar ou o limite grátis acabar.
const KEYWORDS =
  /suicid|me matar|quero morrer|vou me matar|tirar (a )?minha vida|acabar com (tudo|minha vida)|n[aã]o quero (mais )?viver|me machucar|me cortar|automutila|overdose/i;

export const keywordRisk = (messages) =>
  KEYWORDS.test(messages[messages.length - 1]?.content ?? "");

export async function detectRisk(messages) {
  if (keywordRisk(messages)) return true;

  try {
    const transcript = messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Pessoa" : "Sunny"}: ${m.content}`)
      .join("\n");

    const text = await generate({
      model: RISK_MODEL,
      system: INSTRUCTION,
      messages: [{ role: "user", content: transcript }],
      maxOutputTokens: 512,
      json: true,
    });
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(json).risco === "alto";
  } catch (err) {
    console.error("Falha na triagem de risco:", err.message);
    return false; // o prompt principal também trata situações de crise
  }
}
