import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AIChat from '../components/UI/AIChat'
import { goalApi } from '../services/api'

const Goals = () => {
  const [objective, setObjective] = useState('')
  const [tasks, setTasks] = useState([])
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [thinkingMode, setThinkingMode] = useState(true)

  // Start AI discussion when user enters a goal
  const startGoalDiscussion = async () => {
    if (!objective.trim()) return

    setShowChat(true)
    setIsLoading(true)
    setError(null)
    setChatMessages([])
    setStreamingContent('')

    // Add user message immediately
    const userMessage = { 
      role: 'user', 
      content: `I want to achieve this goal: "${objective}". Can you help me break it down into manageable subgoals?` 
    }
    setChatMessages([userMessage])

    try {
      const response = await goalApi.discuss(
        { goal: objective, conversationHistory: [], enableThinking: thinkingMode },
        // Streaming callback - receives each chunk of text
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        }
      )
      
      // Once complete, add the full message to chat history
      setChatMessages([userMessage, { role: 'assistant', content: response.message }])
      setStreamingContent('')
    } catch (err) {
      setError(err.message)
      setChatMessages([
        userMessage,
        { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}. Please make sure the server is running.` }
      ])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  // Continue the conversation
  const handleSendMessage = async (message) => {
    const newMessages = [...chatMessages, { role: 'user', content: message }]
    setChatMessages(newMessages)
    setIsLoading(true)
    setError(null)
    setStreamingContent('')

    try {
      const response = await goalApi.discuss(
        {
          goal: objective,
          conversationHistory: newMessages,
          userMessage: message,
          enableThinking: thinkingMode
        },
        // Streaming callback
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        }
      )
      
      // Once complete, add the full message to chat history
      setChatMessages([...newMessages, { role: 'assistant', content: response.message }])
      setStreamingContent('')
    } catch (err) {
      setError(err.message)
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }
      ])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  // Extract and apply AI-suggested subgoals
  const applyAISuggestions = async () => {
    if (chatMessages.length < 2) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await goalApi.extractSubgoals({
        goal: objective,
        conversationHistory: chatMessages
      })

      if (response.subgoals && response.subgoals.length > 0) {
        const newTasks = response.subgoals.map((subgoal, index) => ({
          id: Date.now() + index,
          title: subgoal.title,
          description: subgoal.description,
          date: new Date(Date.now() + (subgoal.estimatedDays || 7) * 86400000).toISOString().split('T')[0],
          priority: subgoal.priority || 'medium',
          done: false
        }))
        setTasks(newTasks)
        setShowChat(false)
      }
    } catch (err) {
      setError(err.message)
      setChatMessages([
        ...chatMessages,
        { role: 'assistant', content: `I couldn't extract the subgoals automatically. You can add them manually from our discussion.` }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const addTask = () => {
    const newTask = {
      id: Date.now(),
      title: '',
      date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      priority: 'medium',
      done: false,
      editing: true,
    }
    setTasks(prev => [...prev, newTask])
  }

  const updateTask = (id, field, value) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const totalTasks = tasks.length
  const completionDays = tasks.length > 0 
    ? Math.max(1, Math.ceil((new Date(Math.max(...tasks.map(t => new Date(t.date)))) - new Date()) / 86400000))
    : 0

  const quickActions = [
    "I have about 3 months for this",
    "I can dedicate 2 hours daily",
    "What should I prioritize first?",
    "These look good, finalize them"
  ]

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700'
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Goal</h1>
            <p className="text-gray-500">Define your vision and let AI help break it down into actionable steps.</p>
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
        </div>

        {/* Objective Input */}
        <div className="mb-6 animate-slide-up stagger-1">
          <label htmlFor="objective-input" className="block text-sm font-semibold text-gray-700 mb-2">What's your main goal?</label>
          <div className="flex gap-3">
            <input
              id="objective-input"
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startGoalDiscussion()}
              placeholder="e.g., Launch my SaaS MVP by Q3, Learn Spanish to conversational level..."
              className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
            {/* Thinking Mode Toggle */}
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
              disabled={!objective.trim() || isLoading}
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Milestones & Subtasks */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 animate-slide-up stagger-2" aria-labelledby="milestones-heading">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 id="milestones-heading" className="text-lg font-bold text-gray-900">Subgoals & Tasks</h2>
            </div>
            <button
              onClick={addTask}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Manually
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-5">
            {tasks.length === 0 
              ? "Enter a goal above and discuss it with AI to generate subgoals, or add them manually."
              : "These subgoals were generated from your AI conversation. Feel free to edit them."}
          </p>

          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No subgoals yet</p>
              <p className="text-sm text-gray-400">Start a conversation with AI to break down your goal</p>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-4 px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-all duration-200 group ${
                    task.done ? 'opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Mark "${task.title || 'Untitled task'}" as ${task.done ? 'incomplete' : 'complete'}`}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                      task.done
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {task.done && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  {task.editing ? (
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter task title..."
                      value={task.title}
                      onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                      onBlur={() => updateTask(task.id, 'editing', false)}
                      onKeyDown={(e) => e.key === 'Enter' && updateTask(task.id, 'editing', false)}
                      className="flex-1 text-sm text-gray-800 bg-transparent border-none outline-none"
                      aria-label="Task title"
                    />
                  ) : (
                    <div className="flex-1">
                      <span
                        className={`text-sm font-medium cursor-pointer ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        onClick={() => updateTask(task.id, 'editing', true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && updateTask(task.id, 'editing', true)}
                      >
                        {task.title || 'Untitled task'}
                      </span>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    {task.priority && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={task.date}
                        onChange={(e) => updateTask(task.id, 'date', e.target.value)}
                        className="text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer"
                        aria-label={`Due date for "${task.title || 'Untitled task'}"`}
                      />
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete "${task.title || 'Untitled task'}"`}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bottom Stats & Actions */}
        {tasks.length > 0 && (
          <div className="flex items-center justify-between mb-8 px-1 animate-slide-up stagger-3">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Subgoals</p>
                <p className="text-2xl font-extrabold text-gray-900">{totalTasks}</p>
              </div>
              <div className="w-px h-10 bg-gray-200" aria-hidden="true"></div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estimated Timeline</p>
                <p className="text-2xl font-extrabold text-gray-900">{completionDays} Days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 text-gray-600 font-medium text-sm hover:text-gray-800 transition-colors">
                Save Draft
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                Create Goal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Sidebar */}
      {showChat && (
        <div className="w-96 border-l border-gray-100 flex flex-col bg-gray-50 shrink-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-gray-900">Goal Discussion</h3>
            <div className="flex items-center gap-2">
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

      {/* Floating AI Button (when chat is closed) */}
      {!showChat && objective && (
        <button 
          onClick={startGoalDiscussion}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          aria-label="Open AI assistant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default Goals
