import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGoalStore } from '../store/goalStore'
import AIChat from '../components/UI/AIChat'
import { goalApi } from '../services/api'

const Goals = () => {
  // Navigation state: 'goals' | 'milestones' | 'tasks'
  const [view, setView] = useState('goals')
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // AI Discussion state
  const [aiObjective, setAiObjective] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [thinkingMode, setThinkingMode] = useState(true)
  
  // Zustand store
  const {
    goals,
    selectedGoal,
    selectedMilestone,
    loading,
    error,
    fetchGoals,
    fetchGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    selectGoal,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    selectMilestone,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError,
  } = useGoalStore()

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // Handle creating a new goal
  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return
    await createGoal({
      title: newGoalTitle.trim(),
      description: null,
      targetDate: null,
    })
    setNewGoalTitle('')
  }

  // Handle selecting a goal and navigating to milestones view
  const handleSelectGoal = async (goal) => {
    await fetchGoal(goal.id)
    setView('milestones')
  }

  // Handle creating a new milestone
  const handleCreateMilestone = async () => {
    if (!newMilestoneTitle.trim() || !selectedGoal) return
    await createMilestone(selectedGoal.id, {
      title: newMilestoneTitle.trim(),
      description: null,
      targetDate: null,
    })
    setNewMilestoneTitle('')
    // Refresh goal to get updated milestones
    await fetchGoal(selectedGoal.id)
  }

  // Handle selecting a milestone and navigating to tasks view
  const handleSelectMilestone = (milestone) => {
    selectMilestone(milestone)
    setView('tasks')
  }

  // Handle creating a new task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedMilestone) return
    await createTask(selectedMilestone.id, {
      title: newTaskTitle.trim(),
      priority: 'MEDIUM',
    })
    setNewTaskTitle('')
    // Refresh goal to get updated tasks
    if (selectedGoal) {
      await fetchGoal(selectedGoal.id)
    }
  }

  // Toggle task status
  const handleToggleTask = async (taskId) => {
    const task = selectedMilestone?.tasks?.find(t => t.id === taskId)
    if (!task) return

    const statusCycle = {
      'PENDING': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'PENDING'
    }
    const newStatus = statusCycle[task.status] || 'PENDING'
    await toggleTaskStatus(taskId, newStatus)
    
    if (selectedGoal) {
      await fetchGoal(selectedGoal.id)
    }
  }

  // Go back to previous view
  const handleGoBack = () => {
    if (view === 'tasks') {
      selectMilestone(null)
      setView('milestones')
    } else if (view === 'milestones') {
      selectGoal(null)
      setView('goals')
    }
  }

  // AI Discussion functions
  const startGoalDiscussion = async () => {
    if (!aiObjective.trim()) return

    setShowChat(true)
    setIsLoading(true)
    setChatError(null)
    setChatMessages([])
    setStreamingContent('')

    const userMessage = { 
      role: 'user', 
      content: `I want to achieve this goal: "${aiObjective}". Can you help me break it down into manageable subgoals?` 
    }
    setChatMessages([userMessage])

    try {
      const response = await goalApi.discuss(
        { goal: aiObjective, conversationHistory: [], enableThinking: thinkingMode },
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        }
      )
      setChatMessages([userMessage, { role: 'assistant', content: response.message }])
      setStreamingContent('')
    } catch (err) {
      setChatError(err.message)
      setChatMessages([
        userMessage,
        { role: 'error', content: `Sorry, I encountered an error: ${err.message}. Please make sure the server is running.` }
      ])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (message) => {
    const newMessages = [...chatMessages, { role: 'user', content: message }]
    setChatMessages(newMessages)
    setIsLoading(true)
    setChatError(null)
    setStreamingContent('')

    try {
      const response = await goalApi.discuss(
        {
          goal: aiObjective,
          conversationHistory: newMessages,
          userMessage: message,
          enableThinking: thinkingMode
        },
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        }
      )
      setChatMessages([...newMessages, { role: 'assistant', content: response.message }])
      setStreamingContent('')
    } catch (err) {
      setChatError(err.message)
      setChatMessages([
        ...newMessages,
        { role: 'error', content: `Sorry, I encountered an error: ${err.message}` }
      ])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  const applyAISuggestions = async () => {
    if (chatMessages.length < 2) return

    setIsLoading(true)
    setChatError(null)

    try {
      const response = await goalApi.extractSubgoals({
        goal: aiObjective,
        conversationHistory: chatMessages
      })

      if (response.subgoals && response.subgoals.length > 0) {
        for (const subgoal of response.subgoals) {
          await createGoal({
            title: subgoal.title,
            description: subgoal.description || null,
            targetDate: subgoal.estimatedDays ? new Date(Date.now() + subgoal.estimatedDays * 86400000).toISOString() : null,
          })
        }
        await fetchGoals()
        setShowChat(false)
        setAiObjective('')
      }
    } catch (err) {
      setChatError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    "I have about 3 months for this",
    "I can dedicate 2 hours daily",
    "What should I prioritize first?",
    "These look good, finalize them"
  ]

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-emerald-100 text-emerald-700'
  }

  const statusColors = {
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    PENDING: 'bg-gray-100 text-gray-600'
  }

  const milestones = selectedGoal?.milestones || []
  const tasks = selectedMilestone?.tasks || []

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex-1 px-8 py-6 overflow-y-auto transition-all duration-300 ${showChat ? 'pr-4' : ''}`}>
        {/* Back Link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {view === 'goals' && 'Create New Goal'}
              {view === 'milestones' && selectedGoal?.title}
              {view === 'tasks' && selectedMilestone?.title}
            </h1>
            <p className="text-gray-500">
              {view === 'goals' && 'Define your vision and break it down into actionable steps.'}
              {view === 'milestones' && 'Break down your goal into milestones.'}
              {view === 'tasks' && 'Add tasks to complete this milestone.'}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Powered</p>
              <p className="text-lg font-extrabold text-indigo-700">Goal Coach</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Goals</p>
              <p className="text-lg font-extrabold text-indigo-700">{goals.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span><strong>Error:</strong> {error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">Dismiss</button>
          </div>
        )}

        {/* GOALS VIEW */}
        {view === 'goals' && (
          <>
            {/* AI Discussion Input */}
            <div className="mb-8 animate-slide-up stagger-1">
              <label htmlFor="ai-goal-input" className="block text-sm font-semibold text-gray-700 mb-2">What's your main goal?</label>
              <div className="flex gap-3">
                <input
                  id="ai-goal-input"
                  type="text"
                  value={aiObjective}
                  onChange={(e) => setAiObjective(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startGoalDiscussion()}
                  placeholder="e.g., Launch my SaaS MVP by Q3, Learn Spanish to conversational level..."
                  className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                />
                <button
                  onClick={() => setThinkingMode(!thinkingMode)}
                  title={thinkingMode ? "Thinking mode ON - AI will reason deeply" : "Thinking mode OFF - Faster responses"}
                  className={`px-4 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 border-2 ${
                    thinkingMode 
                      ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' 
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="hidden sm:inline">{thinkingMode ? 'Deep' : 'Fast'}</span>
                </button>
                <button
                  onClick={startGoalDiscussion}
                  disabled={!aiObjective.trim() || isLoading}
                  className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Discuss with AI
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                AI will help you break down this goal into achievable subgoals through conversation.
                {thinkingMode && <span className="text-purple-500 ml-1">(Deep thinking enabled)</span>}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Or create manually</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Manual Goal Input */}
            <div className="mb-6 animate-slide-up stagger-2">
              <label htmlFor="manual-goal-input" className="block text-sm font-semibold text-gray-700 mb-2">Create a goal manually</label>
              <div className="flex gap-3">
                <input
                  id="manual-goal-input"
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGoal()}
                  placeholder="Enter goal title..."
                  className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                />
                <button
                  onClick={handleCreateGoal}
                  disabled={!newGoalTitle.trim() || loading}
                  className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Goal
                </button>
              </div>
            </div>

            {/* Goals List */}
            <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 animate-slide-up stagger-2" aria-labelledby="goals-heading">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 id="goals-heading" className="text-lg font-bold text-gray-900">Your Goals</h2>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                {goals.length === 0 
                  ? "Enter a goal above to get started."
                  : "Click on a goal to view and manage its milestones."}
              </p>

              {loading && goals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">Loading goals...</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-2">No goals yet</p>
                  <p className="text-sm text-gray-400">Enter a goal above to get started</p>
                </div>
              ) : (
                <ul className="space-y-3" role="list">
                  {goals.map((goal) => (
                    <li
                      key={goal.id}
                      onClick={() => handleSelectGoal(goal)}
                      className="flex items-center gap-4 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{goal.milestoneCount || 0} milestones</span>
                          <div className="flex items-center gap-1">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                                style={{ width: `${goal.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{goal.progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {/* MILESTONES VIEW */}
        {view === 'milestones' && selectedGoal && (
          <>
            {/* Back button */}
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Goals
            </button>

            {/* Milestone Input */}
            <div className="mb-6 animate-slide-up stagger-1">
              <label htmlFor="milestone-input" className="block text-sm font-semibold text-gray-700 mb-2">Add a milestone</label>
              <div className="flex gap-3">
                <input
                  id="milestone-input"
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateMilestone()}
                  placeholder="e.g., Complete market research, Build MVP, Launch beta..."
                  className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                />
                <button
                  onClick={handleCreateMilestone}
                  disabled={!newMilestoneTitle.trim() || loading}
                  className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Manually
                </button>
              </div>
            </div>

            {/* Milestones List */}
            <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 animate-slide-up stagger-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">Milestones</h2>
                </div>
                <span className="text-sm text-gray-400">{milestones.length} total</span>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                {milestones.length === 0 
                  ? "Add milestones to break down your goal."
                  : "Click on a milestone to view and manage its tasks."}
              </p>

              {milestones.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-2">No milestones yet</p>
                  <p className="text-sm text-gray-400">Add milestones to break down your goal</p>
                </div>
              ) : (
                <ul className="space-y-3" role="list">
                  {milestones.map((milestone) => (
                    <li
                      key={milestone.id}
                      onClick={() => handleSelectMilestone(milestone)}
                      className="flex items-center gap-4 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{milestone.title}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{milestone.taskCount || 0} tasks</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[milestone.status] || statusColors.PENDING}`}>
                            {milestone.status || 'PENDING'}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                                style={{ width: `${milestone.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{milestone.progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMilestone(milestone.id); fetchGoal(selectedGoal.id); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {/* TASKS VIEW */}
        {view === 'tasks' && selectedMilestone && (
          <>
            {/* Back button */}
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Milestones
            </button>

            {/* Task Input */}
            <div className="mb-6 animate-slide-up stagger-1">
              <label htmlFor="task-input" className="block text-sm font-semibold text-gray-700 mb-2">Add a task</label>
              <div className="flex gap-3">
                <input
                  id="task-input"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                  placeholder="e.g., Research competitors, Draft wireframes, Write documentation..."
                  className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                />
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim() || loading}
                  className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Manually
                </button>
              </div>
            </div>

            {/* Tasks List */}
            <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 animate-slide-up stagger-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">Tasks</h2>
                </div>
                <span className="text-sm text-gray-400">{tasks.length} total</span>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                {tasks.length === 0 
                  ? "Add tasks to complete this milestone."
                  : "Click the checkbox to cycle through task status: Pending -> In Progress -> Completed."}
              </p>

              {tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-2">No tasks yet</p>
                  <p className="text-sm text-gray-400">Add tasks to complete this milestone</p>
                </div>
              ) : (
                <ul className="space-y-3" role="list">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className={`flex items-center gap-4 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-all duration-200 group ${
                        task.status === 'COMPLETED' ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500 border-emerald-500'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 border-amber-400'
                            : 'border-gray-300 hover:border-indigo-400'
                        }`}
                      >
                        {task.status === 'COMPLETED' && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        {task.priority && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                            {task.priority}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[task.status] || statusColors.PENDING}`}>
                          {task.status || 'PENDING'}
                        </span>
                        <button
                          onClick={() => { deleteTask(task.id); fetchGoal(selectedGoal.id); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Progress Summary */}
            {tasks.length > 0 && (
              <div className="flex items-center justify-between mb-8 px-1 animate-slide-up stagger-3">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Tasks</p>
                    <p className="text-2xl font-extrabold text-gray-900">{tasks.length}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" aria-hidden="true"></div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-extrabold text-emerald-600">
                      {tasks.filter(t => t.status === 'COMPLETED').length}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" aria-hidden="true"></div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Progress</p>
                    <p className="text-2xl font-extrabold text-amber-600">
                      {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Chat Sidebar */}
      {showChat && (
        <div className="w-96 border-l border-gray-100 flex flex-col bg-gray-50 shrink-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-gray-900">Goal Discussion</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setThinkingMode(!thinkingMode)}
                title={thinkingMode ? "Thinking mode ON - AI will reason deeply" : "Thinking mode OFF - Faster responses"}
                className={`p-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 ${
                  thinkingMode 
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-[10px] font-medium">{thinkingMode ? 'Deep' : 'Fast'}</span>
              </button>
              <button
                onClick={applyAISuggestions}
                disabled={chatMessages.length < 2 || isLoading}
                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Suggestions
              </button>
              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Discuss your goal with AI..."
              quickActions={quickActions}
              title="Goal Coach"
              subtitle="Helping you plan"
              streamingContent={streamingContent}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals
