import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import SobrePage from './pages/SobrePage.jsx'
import ChatPage from './pages/ChatPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sobre" element={<SobrePage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  )
}

export default App
