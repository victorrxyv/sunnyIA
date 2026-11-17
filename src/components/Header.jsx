import './Header.css'
import Robot from './Robot.jsx'

export default function Header() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Robot className="logo" />
        <span className="brand-name">SUNNY.IA</span>
      </div>
    </header>
  )
}
