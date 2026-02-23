import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MarkdownMessage = ({ content }) => {
  return (
    <div className="ai-markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2 pb-1 border-b border-gray-200">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-gray-800 mt-3 mb-1.5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-gray-800 mt-2.5 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-7 text-gray-700 mb-2 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-1 space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-1 space-y-1.5 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children, ordered }) => (
            <li className="text-sm leading-6 text-gray-700 flex items-start gap-2">
              {!ordered && (
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              )}
              <span className="flex-1">{children}</span>
            </li>
          ),
          code: ({ inline, className, children }) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono rounded-md border border-indigo-100">
                  {children}
                </code>
              )
            }
            return (
              <div className="my-3 rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">Code</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                </div>
                <pre className="bg-gray-900 px-4 py-3 overflow-x-auto">
                  <code className="text-xs font-mono text-gray-300 leading-relaxed">{children}</code>
                </pre>
              </div>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-4 border-l-3 border-indigo-300 bg-indigo-50/50 py-2 pr-3 rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-3 border-gray-200" />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-2 transition-colors">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-gray-700 border-t border-gray-100">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

const AIChat = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholder = "Type your message...",
  quickActions = [],
  title = "AI Assistant",
  subtitle = "Ready to help",
  streamingContent = ''
}) => {
  const [input, setInput] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, streamingContent])

  // Close maximized on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isMaximized])

  const handleSend = (text) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    onSendMessage(messageText)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const chatContent = (
    <div className={`flex flex-col h-full bg-white overflow-hidden ${isMaximized ? 'rounded-none' : 'rounded-2xl border border-gray-100'}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-white to-indigo-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-gray-400">{subtitle}</span>
            </div>
          </div>
        </div>

        {/* Maximize / Minimize Button */}
        <button
          onClick={() => setIsMaximized(!isMaximized)}
          className="p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 text-gray-400 hover:text-indigo-600 group"
          title={isMaximized ? 'Minimize chat' : 'Maximize chat'}
        >
          {isMaximized ? (
            <svg className="w-4.5 h-4.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Start a conversation</p>
            <p className="text-xs text-gray-400">Ask anything — I'm here to help you plan and grow.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex gap-3 max-w-[88%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {(message.role === 'assistant' || message.role === 'error') && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                  message.role === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200'
                }`}>
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
                      <p className="text-sm leading-relaxed text-red-700 font-medium">{message.content}</p>
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
        ))}

        {/* Streaming content - show AI response as it arrives */}
        {isLoading && streamingContent && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3 max-w-[88%]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                  <MarkdownMessage content={streamingContent} />
                  <span className="inline-block w-2 h-4 bg-indigo-500 rounded-sm ml-0.5 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator - only show when loading but no content yet */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3 max-w-[88%]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl rounded-tl-md shadow-sm">
                <div className="flex gap-1.5 items-center h-5">
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="px-5 pb-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action)}
                disabled={isLoading}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all disabled:opacity-50 shadow-sm"
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-all duration-300 shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  // Maximized: render as fullscreen overlay
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-3xl h-[90vh] rounded-2xl shadow-2xl shadow-indigo-200/50 overflow-hidden animate-scale-in">
          {chatContent}
        </div>
      </div>
    )
  }

  return chatContent
}

export { MarkdownMessage }
export default AIChat
