import './SobrePage.css'
import { useNavigate } from 'react-router-dom'
import Robot from '../components/Robot.jsx'

export default function SobrePage() {
  const navigate = useNavigate()

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
      <button className="btn solid" onClick={() => navigate('/chat')}>TESTAR</button>
      <button className="btn outline" onClick={() => navigate('/')}>VOLTAR</button>
    </div>
  )
}
