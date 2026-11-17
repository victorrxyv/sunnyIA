// Valida e limpa o histórico recebido do site (usado pelo Express e pela Vercel).
export function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .slice(-20)
    .map((m) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content ?? "").slice(0, 2000),
    }))
    .filter((m) => m.content.trim());
  while (msgs.length && msgs[0].role === "assistant") msgs.shift();
  return msgs.length && msgs[msgs.length - 1].role === "user" ? msgs : null;
}
