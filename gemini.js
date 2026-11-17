// Cliente mínimo da API do Gemini (sem SDK, só fetch).
const BASE = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/models";

export const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
export const RISK_MODEL = process.env.GEMINI_RISK_MODEL || "gemini-flash-lite-latest";

// Conversas de apoio emocional podem citar temas pesados: só bloqueia o que for extremo.
const SAFETY = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

// O Gemini usa "model" em vez de "assistant" e prefere turnos alternados.
function toContents(messages) {
  const out = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts[0].text += "\n" + m.content;
    else out.push({ role, parts: [{ text: m.content }] });
  }
  return out;
}

function buildBody({ system, messages, maxOutputTokens, json }) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: toContents(messages),
    generationConfig: {
      maxOutputTokens,
      temperature: 0.8,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
    safetySettings: SAFETY,
  };
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": process.env.GEMINI_API_KEY || "",
  };
}

const textOf = (data) =>
  (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text || "").join("");

export async function generate({ model, system, messages, maxOutputTokens = 512, json = false }) {
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(buildBody({ system, messages, maxOutputTokens, json })),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return textOf(await res.json());
}

// Resposta em streaming. Chama onText a cada pedaço e devolve o total de caracteres.
export async function streamGenerate({ model, system, messages, onText, maxOutputTokens = 2048 }) {
  const res = await fetch(`${BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(buildBody({ system, messages, maxOutputTokens, json: false })),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let total = 0;

  const handleLine = (line) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload) return;
    try {
      const text = textOf(JSON.parse(payload));
      if (text) {
        total += text.length;
        onText(text);
      }
    } catch {
      /* linha incompleta ou sem texto: ignora */
    }
  };

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    lines.forEach(handleLine);
  }
  handleLine(buffer);
  return total;
}
