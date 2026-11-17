import './HomePage.css'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <Header />

      <main className="hero-grid">
        <section className="hero-text">
          <h1>
            <span className="mint">SUNNY:</span> SEU OMBRO AMIGO <span className="mint">VIRTUAL!</span>
          </h1>
          <p className="box">
            Sunny é um bot criado para ser seu ombro amigo virtual. Este bot está sempre aqui para
            ouvir, conversar e oferecer apoio quando você precisar.
          </p>
          <div className="actions">
            <button className="btn outline" onClick={() => navigate('/chat')}>TESTAR</button>
            <button className="btn solid" onClick={() => navigate('/sobre')}>SAIBA MAIS</button>
          </div>
        </section>
        <img
          className="hero-img"
          src="/img/sunny/bot.png"
          alt="Sunny, o robô amigo, acenando ao lado de um celular com uma conversa"
        />
      </main>

      <footer>Desenvolvido por © Shaolean</footer>
    </div>
  )
}
