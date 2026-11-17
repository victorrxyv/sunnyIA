import { useState } from 'react'
import './Composer.css'

export default function Composer({ busy, onSend }) {
  const [input, setInput] = useState('')

  function enviar() {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="composer">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Digite sua mensagem..."
        rows={1}
        maxLength={2000}
        aria-label="Sua mensagem"
      />
      <button onClick={enviar} disabled={busy || !input.trim()} aria-label="Enviar">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M3 11.5 21 3l-5 18-4.5-7L3 11.5Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
