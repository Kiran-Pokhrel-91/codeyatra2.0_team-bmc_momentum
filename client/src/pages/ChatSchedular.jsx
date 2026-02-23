import React, { useState, useRef, useEffect } from 'react'
import { planningApi, goalApi, dailyPlanApi } from '../services/api'
import { MarkdownMessage } from '../components/UI/AIChat'

const ChatSchedular = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [scheduledTasks, setScheduledTasks] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState(null)
  const [totalWorkHours, setTotalWorkHours] = useState(0)
  const [focusBlocks, setFocusBlocks] = useState(0)
  const [streamingContent, setStreamingContent] = useState('')
  const [thinkingMode, setThinkingMode] = useState(true)
  const [goals, setGoals] = useState([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const saveStatusTimerRef = useRef(null)

  // Fetch goals from API on mount
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const goalsData = await goalApi.getAllGoals()
        const goalsWithMilestones = await Promise.all(
          goalsData.map(async (goal) => {
            const fullGoal = await goalApi.getGoal(goal.id)
            return {
              id: goal.id,
              title: goal.title,
              progress: goal.progress || 0,
              milestones: fullGoal.milestones || []
            }
          })
        )
        setGoals(goalsWithMilestones)
      } catch (err) {
        console.error('Error fetching goals:', err)
      } finally {
        setLoadingGoals(false)
      }
    }
    fetchGoals()
  }, [])

  const quickActions = [
    "I want to focus on high priority tasks",
    "Give me more time for deep work",
    "I need a lighter schedule tomorrow",
    "Add a longer lunch break",
    "Finalize the schedule"
  ]

  // Auto-dismiss save status after 5 seconds
  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current)
    }
  }, [])

  const showSaveStatus = (type, message) => {
    setSaveStatus({ type, message })
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current)
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus(null), 5000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const initializeChat = async () => {
    setIsTyping(true)
    setError(null)
    setStreamingContent('')

    // If no goals exist, show a helpful message without calling the server
    if (goals.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Good morning! It looks like you don't have any goals set up yet. Head over to the **Goals** page to create some goals with milestones and checkpoints, then come back here and I'll help you plan your day around them!"
        }
      ])
      setIsInitialized(true)
      setIsTyping(false)
      return
    }

    try {
      const response = await planningApi.suggest(
        {
          goals,
          existingTasks: [],
          userPreferences: null,
          conversationHistory: [],
          enableThinking: thinkingMode
        },
        // Streaming callback
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        }
      )

      const initialMessages = [
        {
          role: 'assistant',
          content: response.message
        }
      ]

      setMessages(initialMessages)
      setStreamingContent('')
      setIsInitialized(true)
    } catch (err) {
      setError(err.message)
      setMessages([
        {
          role: 'error',
          content: `Good morning! I'd love to help you plan your day, but I'm having trouble connecting to the AI service. Please make sure the server is running.\n\nError: ${err.message}`
        }
      ])
      setStreamingContent('')
      setIsInitialized(true)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async (text) => {
    const messageText = text || input.trim()
    if (!messageText || isTyping) return

    const newMessages = [...messages, { role: 'user', content: messageText }]
    // Filter out error messages - LLMs only accept system/user/assistant roles
    const validHistory = newMessages.filter(m => m.role !== 'error')
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)
    setError(null)
    setStreamingContent('')

    try {
      // Check if user wants to finalize the schedule
      const lowerMessage = messageText.toLowerCase().trim()
      const finalizePatterns = [
        /\bfinalize\b/,
        /\blooks?\s+good\b.*\b(finalize|save|confirm|done|ready|go\s+ahead|set)\b/,
        /\b(finalize|save|confirm|done|ready|go\s+ahead|set)\b.*\blooks?\s+good\b/,
        /\bconfirm\s+(the\s+)?(schedule|plan|tasks?)\b/,
        /\b(save|lock\s*in|set)\s+(the\s+)?(schedule|plan)\b/,
        /\b(i'?m|that'?s|this\s+is)\s+(happy|satisfied|good|done|ready)\b/,
        /\blet'?s?\s+(go\s+with|do)\s+(this|that|it)\b/,
        /\b(perfect|great|awesome),?\s*(finalize|save|confirm|let'?s?\s+go)/,
      ]
      const isFinalize = finalizePatterns.some(pattern => pattern.test(lowerMessage))

      if (isFinalize && messages.length >= 2) {
        // Try to extract the schedule (non-streaming JSON endpoint)
        const response = await planningApi.finalize({ conversationHistory: validHistory })
        
        if (response.schedule && response.schedule.length > 0) {
          setScheduledTasks(response.schedule)
          calculateStats(response.schedule)
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: "I've finalized your schedule for tomorrow. You can see all tasks in the Daily View panel on the right. Feel free to ask me to make any adjustments, or click 'Confirm & Sync to Calendar' when you're ready!"
            }
          ])
        } else {
          throw new Error('Could not extract schedule')
        }
      } else {
        // Check if this is a tweak request
        const isTweak = scheduledTasks.length > 0 && (
          messageText.toLowerCase().includes('more time') ||
          messageText.toLowerCase().includes('less time') ||
          messageText.toLowerCase().includes('change') ||
          messageText.toLowerCase().includes('move') ||
          messageText.toLowerCase().includes('add') ||
          messageText.toLowerCase().includes('remove') ||
          messageText.toLowerCase().includes('adjust')
        )

        // Streaming callback for both tweak and suggest
        const onChunk = (chunk, fullContent) => {
          setStreamingContent(fullContent)
        }

        let response
        if (isTweak) {
          response = await planningApi.tweak(
            {
              currentPlan: scheduledTasks,
              userRequest: messageText,
              conversationHistory: validHistory.slice(-4), // Last few messages for context
              enableThinking: thinkingMode
            },
            onChunk
          )
        } else {
          response = await planningApi.suggest(
            {
              goals,
              existingTasks: scheduledTasks,
              userPreferences: messageText,
              conversationHistory: validHistory,
              enableThinking: thinkingMode
            },
            onChunk
          )
        }

        setMessages([...newMessages, { role: 'assistant', content: response.message }])
        setStreamingContent('')
      }
    } catch (err) {
      setError(err.message)
      setMessages([
        ...newMessages,
        {
          role: 'error',
          content: `I encountered an issue: ${err.message}. Let me try to help you differently. What would you like to adjust in your schedule?`
        }
      ])
      setStreamingContent('')
    } finally {
      setIsTyping(false)
    }
  }

  const calculateStats = (tasks) => {
    let totalMinutes = 0
    let blocks = 0

    tasks.forEach(task => {
      const minutes = task.estimatedMins || 60
      totalMinutes += minutes
      if (minutes >= 60) blocks++
    })

    setTotalWorkHours((totalMinutes / 60).toFixed(1))
    setFocusBlocks(blocks)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const resetChat = () => {
    setMessages([])
    setScheduledTasks([])
    setIsInitialized(false)
    setTotalWorkHours(0)
    setFocusBlocks(0)
  }

  const handleConfirmAndSave = async () => {
    if (scheduledTasks.length === 0 || saving) return

    setSaving(true)
    setSaveStatus(null)

    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const tasksToSave = scheduledTasks.map(task => ({
        title: task.title,
        description: task.description || null,
        estimatedMins: task.estimatedMins || null,
        startTime: task.startTime || null,
        endTime: task.endTime || null,
        status: 'PENDING'
      }))

      await dailyPlanApi.saveDailyPlan(tomorrow.toISOString().split('T')[0], tasksToSave)
      
      showSaveStatus('success', 'Daily plan saved! View it in Focus Mode tomorrow.')
    } catch (err) {
      console.error('Error saving daily plan:', err)
      showSaveStatus('error', `Failed to save: ${err.message}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col border-r border-gray-100">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" role="banner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Daily Planner AI</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isTyping ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isTyping ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="text-[11px] text-gray-400">
                  {isTyping ? 'AI is thinking...' : 'Ready to plan your day'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Thinking Mode Toggle */}
            <button 
              onClick={() => setThinkingMode(!thinkingMode)}
              title={thinkingMode ? "Thinking mode ON - AI will reason deeply" : "Thinking mode OFF - Faster responses"}
              className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                thinkingMode 
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs font-medium hidden sm:inline">{thinkingMode ? 'Deep' : 'Fast'}</span>
            </button>
            <button 
              onClick={resetChat}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors" 
              aria-label="Reset chat"
              title="Start over"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Connection issue:</strong> {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5" role="log" aria-label="Chat messages" aria-live="polite">
          {/* Landing state - show before chat is initialized */}
          {!isInitialized && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Plan Your Day</h2>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                {loadingGoals
                  ? 'Loading your goals...'
                  : goals.length === 0
                    ? "You don't have any goals yet. Head to the Goals page to create some, then come back to plan your day."
                    : `You have ${goals.length} goal${goals.length === 1 ? '' : 's'} with active milestones. Start a planning session and the AI will help you build a schedule for tomorrow.`
                }
              </p>
              <button
                onClick={initializeChat}
                disabled={loadingGoals}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Schedule Tomorrow
              </button>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index}>
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {(message.role === 'assistant' || message.role === 'error') && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                      message.role === 'error'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200'
                    }`} aria-hidden="true">
                      {message.role === 'error' ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                  )}
                   <div className="min-w-0">
                    {message.role === 'error' ? (
                      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 shadow-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm leading-relaxed text-red-700 font-medium whitespace-pre-line">{message.content}</p>
                        </div>
                      </div>
                    ) : message.role === 'assistant' ? (
                      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                        <MarkdownMessage content={message.content} />
                      </div>
                    ) : (
                      <div className="px-4 py-3 rounded-2xl rounded-tr-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200">
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming content - show AI response as it arrives */}
          {isTyping && streamingContent && (
            <div className="flex justify-start" role="status" aria-label="AI is responding">
              <div className="flex gap-3 max-w-[75%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200" aria-hidden="true">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0 px-4 py-3 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl rounded-tl-md shadow-sm">
                  <MarkdownMessage content={streamingContent} />
                  <span className="inline-block w-2 h-4 bg-indigo-500 rounded-sm ml-0.5 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator - only show when loading but no content yet */}
          {isTyping && !streamingContent && (
            <div className="flex justify-start" role="status" aria-label="AI is typing">
              <div className="flex gap-3 max-w-[75%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200" aria-hidden="true">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-md">
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick reply options">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action)}
                disabled={isTyping}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder="Tell AI how you want to plan your day..."
                aria-label="Chat message input"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className={`p-3 rounded-xl transition-all duration-300 shrink-0 ${
                input.trim() && !isTyping
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Say things like "I want to spend 2 hours on the MVP" or "Move the meeting to afternoon"
          </p>
        </div>
      </div>

      {/* Right Panel - Daily View */}
      <aside className="w-80 bg-white px-5 py-5 overflow-y-auto shrink-0 flex flex-col" aria-label="Daily schedule">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tomorrow's Plan</h2>
            <p className="text-xs text-gray-400">{formatDate()}</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${
            scheduledTasks.length > 0 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {scheduledTasks.length > 0 ? 'Ready' : 'Drafting'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-center">
            <div className="flex justify-center mb-1">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-extrabold text-gray-900">{totalWorkHours || '--'}h</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Work Hours</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-center">
            <div className="flex justify-center mb-1">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xl font-extrabold text-gray-900">{focusBlocks || '--'}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Focus Blocks</p>
          </div>
        </div>

        {/* Scheduled Tasks */}
        <div className="mb-6 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scheduled Tasks</h3>
            <span className="text-xs text-gray-400">{scheduledTasks.length} tasks</span>
          </div>
          
          {scheduledTasks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-1">No schedule yet</p>
              <p className="text-xs text-gray-400">Chat with AI to plan your day</p>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {scheduledTasks.map((task, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
                      </span>
                      {task.estimatedMins && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-50 text-indigo-500">
                          {task.estimatedMins}m
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-[11px] text-gray-400 truncate">{task.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AI Insight */}
        {scheduledTasks.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">AI Insight</p>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  I've prioritized high-impact tasks for your peak productivity hours. You can ask me to adjust timing or add breaks anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Status Toast */}
        {saveStatus && (
          <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {saveStatus.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {saveStatus.message}
            <button onClick={() => setSaveStatus(null)} className="ml-auto text-current opacity-60 hover:opacity-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          <button 
            onClick={handleConfirmAndSave}
            disabled={scheduledTasks.length === 0 || saving}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Confirm & Save for Tomorrow
              </>
            )}
          </button>
          <button 
            onClick={resetChat}
            className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors text-center"
          >
            Start Over
          </button>
        </div>
      </aside>
    </div>
  )
}

export default ChatSchedular
