import { Routes, Route, Navigate } from 'react-router-dom'
import DraggableThemeToggle from './components/ui/DraggableThemeToggle'
import LandingPage     from './pages/LandingPage'
import SetupPage       from './pages/SetupPage'
import RoomPage        from './pages/RoomPage'
import ResultsPage     from './pages/ResultsPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <>
      <DraggableThemeToggle />
      <Routes>
        <Route path="/"            element={<LandingPage />} />
        <Route path="/setup"       element={<SetupPage />} />
        <Route path="/room"        element={<RoomPage />} />
        <Route path="/results"     element={<ResultsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
