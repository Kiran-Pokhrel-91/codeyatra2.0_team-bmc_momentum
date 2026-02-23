import React, { useState, useRef } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'

const DashboardLayout = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const mainContentRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || '{"name": "Alex Rivera"}')
  const userName = user.name || 'Alex Rivera'

  const handleLogoClick = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const sidebarLinks = [
    {
      label: 'Dashboard', path: '/dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      label: 'Goals', path: '/goals', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      label: 'Chat Scheduler', path: '/chat', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      label: 'Focus Mode', path: '/focus', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      label: 'Analytics', path: '/analytics', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'Leaderboard', path: '/leaderboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
  ]

  const bottomLinks = [
    {
      label: 'Settings', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      label: 'Profile', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ]

  const pageTitle = sidebarLinks.find(l => l.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-gray-50/80 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-68px' : 'w-60'
          }`}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className={`py-5 border-b border-gray-100 ${sidebarCollapsed ? 'px-3' : 'px-5'}`}>
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer group"
            role="button"
            aria-label="Scroll to top"
          >
            <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200/50 shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MOMENTUM</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.label}
                to={link.path}
                title={sidebarCollapsed ? link.label : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'
                  } ${isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>{link.icon}</span>
                {!sidebarCollapsed && link.label}
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <span className="absolute left-full ml-2 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg pointer-events-none">
                    {link.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Links */}
        <div className={`py-4 border-t border-gray-100 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {bottomLinks.map((link) => (
            <button
              key={link.label}
              title={sidebarCollapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 w-full group relative ${sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'
                }`}
            >
              <span className="text-gray-400 group-hover:text-gray-600 shrink-0">{link.icon}</span>
              {!sidebarCollapsed && link.label}
              {sidebarCollapsed && (
                <span className="absolute left-full ml-2 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg pointer-events-none">
                  {link.label}
                </span>
              )}
            </button>
          ))}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 w-full mt-2 ${sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'
              }`}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0" role="banner">
          <div className="relative w-80">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search goals or tasks..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
              aria-label="Search goals or tasks"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-label="New notifications"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-400">Pro Member</p>
              </div>
              <div className="w-9 h-9 bg-linear-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200/50 cursor-pointer hover:shadow-lg transition-all duration-200" title={userName}>
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
