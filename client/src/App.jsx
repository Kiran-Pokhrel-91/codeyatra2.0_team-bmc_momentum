import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardLayout from './components/layout/DashboardLayout'

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const ChatSchedular = lazy(() => import('./pages/ChatSchedular'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Goals = lazy(() => import('./pages/Goals'))
const FocusMode = lazy(() => import('./pages/FocusMode'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-400 font-medium">Loading...</p>
    </div>
  </div>
)

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App