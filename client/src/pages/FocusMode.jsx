import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { dailyPlanApi } from '../services/api'

const FocusMode = () => {
  const navigate = useNavigate()
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [tasks, setTasks] = useState([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const currentSession = 2
  const totalSessions = 4
  const initialSeconds = 25 * 60

  // Fetch tomorrow's tasks on mount
  useEffect(() => {
    const fetchTomorrowTasks = async () => {
      try {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateStr = tomorrow.toISOString().split('T')[0]
        
        const plan = await dailyPlanApi.getDailyPlan(dateStr)
        if (plan && plan.tasks && plan.tasks.length > 0) {
          setTasks(plan.tasks)
        }
      } catch (err) {
        console.error('Error fetching tomorrow tasks:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTomorrowTasks()
  }, [])

  const currentTask = tasks[currentTaskIndex] || null

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds(prev => {
          if (prev <= 0) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, isPaused])

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const progress = 1 - totalSeconds / initialSeconds
  const circumference = 2 * Math.PI * 140
  const strokeDashoffset = circumference * (1 - progress)

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  const completeTask = useCallback(() => {
    setIsRunning(false)
    setTotalSeconds(0)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePause])

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>

      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 relative z-10" role="banner">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Exit focus mode and return to dashboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Exit Focus
        </button>

        <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-full" role="status">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Session {currentSession} of {totalSessions}</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-500 hover:text-gray-700" aria-label="Toggle ambient sound">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full" role="status">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-600">Flow Mode Active</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-8">
        {/* Task Info */}
        <div className="text-center mb-10 animate-fade-in">
          {loading ? (
            <p className="text-sm text-gray-400">Loading tasks...</p>
          ) : currentTask ? (
            <>
              <p className="text-sm text-gray-400 mb-2">
                Task {currentTaskIndex + 1} of {tasks.length}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight max-w-lg">
                {currentTask.title}
              </h1>
              {currentTask.description && (
                <p className="text-sm text-gray-500 mt-2">{currentTask.description}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-2">No tasks planned for tomorrow</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight max-w-lg">
                Start a focus session
              </h1>
              <p className="text-sm text-gray-500 mt-2">Use the Chat Scheduler to plan your tomorrow's tasks</p>
            </>
          )}
        </div>

        {/* Timer Circle */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-10" role="timer" aria-label={`${String(minutes).padStart(2, '0')} minutes and ${String(seconds).padStart(2, '0')} seconds remaining`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300" aria-hidden="true">
            {/* Background circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
              opacity="0.3"
            />
            {/* Progress circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl sm:text-7xl font-extrabold text-gray-900 tracking-tight tabular-nums" aria-live="off">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-sm" aria-hidden="true">✨</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {isPaused ? 'Paused' : 'Focusing'}
              </span>
            </div>
          </div>
        </div>

        {/* Motivation text */}
        <p className="text-sm text-gray-400 italic mb-6">
          "Your focus determines your reality."
        </p>

        {/* Points indicator */}
        <div className="flex items-center gap-1.5 mb-8">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500">25 Streak Points if completed</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePause}
            aria-label={isPaused ? 'Resume focus session' : 'Pause focus session'}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:translate-y-0 transition-all duration-200"
          >
            {isPaused ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Resume Flow
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6" />
                </svg>
                Pause Flow
              </>
            )}
          </button>
          <button
            onClick={completeTask}
            aria-label="Complete current task and end session"
            className="flex items-center gap-2.5 px-7 py-3.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Complete Task
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-[11px] text-gray-300 mt-6 hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono text-[10px]">Space</kbd> to {isPaused ? 'resume' : 'pause'}
        </p>
      </main>
    </div>
  )
}

export default FocusMode