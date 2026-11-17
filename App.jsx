import { useEffect, useRef, useState } from "react";

const WELCOME =
  "Oi, eu sou a Sunny. Pode desabafar ou só bater um papo comigo. Como você está hoje?";
const ERROR_TEXT = "Não consegui responder agora. Tente enviar de novo em instantes.";

function Robot({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Sunny, o robô amigo">
      <line x1="60" y1="12" x2="60" y2="26" stroke="#5be9b0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="9" r="5" fill="#5be9b0" />
      <path d="M24 68 C24 28 96 28 96 68" fill="none" stroke="#e8f7f0" strokeWidth="7" strokeLinecap="round" />
      <rect x="15" y="58" width="13" height="28" rx="6.5" fill="#e8f7f0" />
      <rect x="92" y="58" width="13" height="28" rx="6.5" fill="#e8f7f0" />
      <rect x="28" y="36" width="64" height="60" rx="22" fill="#e8f7f0" />
      <rect x="36" y="50" width="48" height="28" rx="14" fill="#5be9b0" />
      <path d="M45 63 q5 -7 10 0 M65 63 q5 -7 10 0 M52 71 q8 7 16 0" fill="none" stroke="#0c0d0d" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function Home({ onTest, onMore }) {
  return (
    <div className="page home">
      <header className="brand">
        <Robot className="logo" />
        <span>SUNNY.IA</span>
      </header>
      <Robot className="hero" />
      <h1>
        <span className="mint">SUNNY:</span> SEU OMBRO AMIGO <span className="mint">VIRTUAL!</span>
      </h1>
      <p className="box">
        Sunny é um bot criado para ser seu ombro amigo virtual. Este bot está sempre aqui para
        ouvir, conversar e oferecer apoio quando você precisar.
      </p>
      <button className="btn outline" onClick={onTest}>TESTAR</button>
      <button className="btn solid" onClick={onMore}>SAIBA MAIS</button>
      <footer>Desenvolvido por © Shaolean</footer>
    </div>
  );
}

function About({ onBack, onTest }) {
  return (
    <div className="page about">
      <header className="brand">
        <Robot className="logo" />
        <span>SUNNY.IA</span>
      </header>
      <h2>Como a Sunny ajuda</h2>
      <p>
        Ela escuta sem pressa e sem julgamento. Você pode desabafar sobre o dia, uma perda, a
        ansiedade ou só conversar.
      </p>
      <h2>O que ela não é</h2>
      <p>
        A Sunny é uma IA. Ela não faz diagnóstico, não indica remédios e não substitui psicólogo,
        psiquiatra ou médico.
      </p>
      <h2>Precisa de alguém agora?</h2>
      <p>
        Ligue <strong>188</strong> (CVV, 24h, gratuito) ou <strong>192</strong> (SAMU). Chat do
        CVV: cvv.org.br.
      </p>
      <h2>Privacidade</h2>
      <p>As conversas não ficam salvas. Elas existem só enquanto a aba estiver aberta.</p>
      <button className="btn solid" onClick={onTest}>TESTAR</button>
      <button className="btn outline" onClick={onBack}>VOLTAR</button>
    </div>
  );
}

function Chat({ onExit }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendToLast = (text) =>
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { ...last, content: last.content + text };
      return copy;
    });

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const history = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // a saudação inicial não vai para o modelo
        body: JSON.stringify({ messages: history.slice(1) }),
      });
      if (!res.ok || !res.body) throw new Error("http");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let got = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const data = part.replace(/^data: /, "");
          if (data === "[DONE]") continue;
          const { text: chunk, error } = JSON.parse(data);
          if (chunk || error) got = true;
          appendToLast(chunk ?? error ?? "");
        }
      }
      if (!got) throw new Error("vazio");
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: ERROR_TEXT };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="page chatpage">
      <section className="card">
        <header className="chathead">
          <Robot className="avatar" />
          <span className="name">Sunny.IA</span>
          {busy && <span className="typing">digitando…</span>}
          <button className="exit" onClick={onExit} aria-label="Sair da conversa">Sair</button>
        </header>
        <p className="notice">
          A Sunny é uma IA e não substitui ajuda profissional. Em crise: CVV 188 ou SAMU 192.
        </p>
        <main className="chat" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={"msg " + m.role}>
              {m.content || "…"}
            </div>
          ))}
          <div ref={endRef} />
        </main>
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            maxLength={2000}
            aria-label="Sua mensagem"
          />
          <button onClick={send} disabled={busy || !input.trim()} aria-label="Enviar">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M3 11.5 21 3l-5 18-4.5-7L3 11.5Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  if (view === "chat") return <Chat onExit={() => setView("home")} />;
  if (view === "about") return <About onBack={() => setView("home")} onTest={() => setView("chat")} />;
  return <Home onTest={() => setView("chat")} onMore={() => setView("about")} />;
}
