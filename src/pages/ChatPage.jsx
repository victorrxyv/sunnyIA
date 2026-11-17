import './ChatPage.css'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Robot from '../components/Robot.jsx'
import Composer from '../components/Composer.jsx'

const WELCOME =
  'Oi, eu sou a Sunny. Pode desabafar ou só bater um papo comigo. Como você está hoje?'
const ERROR_TEXT = 'Não consegui responder agora. Tente enviar de novo em instantes.'

export default function ChatPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const appendToLast = text =>
    setMessages(prev => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      copy[copy.length - 1] = { ...last, content: last.content + text }
      return copy
    })

  async function send(text) {
    if (busy) return

    const history = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setBusy(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // a saudação inicial não vai para o modelo
        body: JSON.stringify({ messages: history.slice(1) }),
      })
      if (!res.ok || !res.body) throw new Error('http')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let got = false

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop()
        for (const part of parts) {
          const data = part.replace(/^data: /, '')
          if (data === '[DONE]') continue
          const { text: chunk, error } = JSON.parse(data)
          if (chunk || error) got = true
          appendToLast(chunk ?? error ?? '')
        }
      }
      if (!got) throw new Error('vazio')
    } catch {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: ERROR_TEXT }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page chatpage">
      <section className="card">
        <header className="chathead">
          <Robot className="avatar" />
          <span className="name">Sunny.IA</span>
          <button className="exit" onClick={() => navigate('/')} aria-label="Sair da conversa">Sair</button>
        </header>
        <main className="chat" aria-live="polite">
          <p className="notice">
            A Sunny é uma IA e não substitui ajuda profissional. Em crise: CVV 188 ou SAMU 192.
          </p>
          {messages.map((m, i) => (
            <div key={i} className={'msg ' + m.role}>
              {m.content || 'Digitando…'}
            </div>
          ))}
          <div ref={endRef} />
        </main>
        <Composer busy={busy} onSend={send} />
      </section>
    </div>
  )
}
