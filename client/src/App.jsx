import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardLayout from './components/layout/DashboardLayout'
import Home from './pages/Home'
import ChatSchedular from './pages/ChatSchedular'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import FocusMode from './pages/FocusMode'
import Analytics from './pages/Analytics'
import Leaderboard from './pages/Leaderboard'
import LoginPage from './pages/LoginPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen immersive page */}
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Pages with sidebar layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/chat" element={<ChatSchedular />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>

        {/* Pages with Header/Footer layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App