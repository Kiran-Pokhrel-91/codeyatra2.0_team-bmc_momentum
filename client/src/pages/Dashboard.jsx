import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [checkedTasks, setCheckedTasks] = useState([])

  const toggleTask = (id) => {
    setCheckedTasks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const goals = [
    { title: 'Finish Q3 Marketing Plan', progress: 65, daysLeft: 4, color: 'emerald', icon: '🎯' },
    { title: 'Learn React Native', progress: 32, daysLeft: 12, color: 'amber', icon: '⭐' },
    { title: 'Marathon Training', progress: 88, daysLeft: 2, color: 'orange', icon: '🔥' },
  ]

  const tasks = [
    { id: 1, title: 'Review Q3 Budget Allocation', time: '45 mins', category: 'STRATEGIC', aiRecommended: true },
    { id: 2, title: 'Finalize Component Library Documentation', time: '1h 30m', category: 'DEV', aiRecommended: true },
    { id: 3, title: 'Respond to Stakeholder Feedback', time: '20 mins', category: 'EMAIL', aiRecommended: false },
    { id: 4, title: 'Prepare Project Kickoff Deck', time: '1h', category: 'DESIGN', aiRecommended: true },
  ]

  const badges = [
    { color: 'from-emerald-400 to-emerald-600', icon: '⚡', label: 'Speed' },
    { color: 'from-amber-400 to-amber-600', icon: '⭐', label: 'Star' },
    { color: 'from-orange-400 to-orange-600', icon: '🔥', label: 'Fire' },
    { color: 'from-rose-400 to-rose-600', icon: '🎯', label: 'Target' },
  ]

  const productivityBars = [35, 50, 42, 60, 55, 75, 90, 80, 65, 45]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const colorMap = {
    emerald: { progress: 'bg-emerald-500', bg: 'bg-emerald-100', icon: 'bg-emerald-100' },
    amber: { progress: 'bg-amber-500', bg: 'bg-amber-100', icon: 'bg-amber-100' },
    orange: { progress: 'bg-orange-500', bg: 'bg-orange-100', icon: 'bg-orange-100' },
  }

  const getColorClass = (color, type) => colorMap[color]?.[type] || 'bg-indigo-500'

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {/* Greeting */}
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full mb-3">
              <span className="text-sm" aria-hidden="true">✨</span>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Your Daily Brief</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{getGreeting()}, Alex Rivera</h1>
            <p className="text-gray-500">You're <span className="font-semibold text-indigo-600">82%</span> closer to your weekly milestone. Let's crush today's focus sessions.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full" role="status">
            <span className="text-sm" aria-hidden="true">🔥</span>
            <span className="text-sm font-semibold text-amber-700">7 Day Streak</span>
          </div>
        </div>

        {/* Active Goals */}
        <section className="mb-8 animate-slide-up stagger-1" aria-labelledby="goals-heading">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 id="goals-heading" className="text-lg font-bold text-gray-900">Active Goals</h2>
            </div>
            <Link to="/goals" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              View all goals
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal, i) => (
              <article key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${getColorClass(goal.color, 'icon')} rounded-xl flex items-center justify-center text-lg`} aria-hidden="true">
                    {goal.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-400">{goal.daysLeft} days left</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">{goal.title}</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Progress</span>
                  <span className="text-xs font-semibold text-gray-600">{goal.progress}%</span>
                </div>
                <div className={`w-full h-2 ${getColorClass(goal.color, 'bg')} rounded-full overflow-hidden`} role="progressbar" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.title} progress`}>
                  <div
                    className={`h-full ${getColorClass(goal.color, 'progress')} rounded-full transition-all duration-500`}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* AI Smart Priorities */}
        <section className="animate-slide-up stagger-2" aria-labelledby="priorities-heading">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">✨</span>
              <h2 id="priorities-heading" className="text-lg font-bold text-gray-900">AI Smart Priorities</h2>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200">
              Regenerate Daily List
            </button>
          </div>
          <ul className="space-y-3" role="list">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all duration-300 group ${
                  checkedTasks.includes(task.id) ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Mark "${task.title}" as ${checkedTasks.includes(task.id) ? 'incomplete' : 'complete'}`}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                      checkedTasks.includes(task.id)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {checkedTasks.includes(task.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-sm font-medium ${checkedTasks.includes(task.id) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.title}
                      </span>
                      {task.aiRecommended && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[11px] font-semibold rounded-md">AI Recommended</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.time}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400 tracking-wider">{task.category}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all" aria-label={`Start focus session for "${task.title}"`}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Right Sidebar */}
      <aside className="w-72 border-l border-gray-100 bg-white px-5 py-6 overflow-y-auto shrink-0 hidden xl:block" aria-label="Dashboard sidebar">
        {/* Performance Stats */}
        <div className="mb-7">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Performance Stats</h3>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">1,250</p>
              <p className="text-xs text-gray-400 mt-0.5">Total Focus Points</p>
            </div>
            <div className="ml-auto w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="mb-7">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Badges</h3>
          <div className="flex items-center gap-2 mb-3">
            {badges.map((badge, i) => (
              <div key={i} className={`w-10 h-10 bg-linear-to-br ${badge.color} rounded-full flex items-center justify-center text-sm shadow-sm`} title={badge.label} aria-label={`${badge.label} badge`}>
                {badge.icon}
              </div>
            ))}
            <span className="text-sm font-medium text-gray-400 ml-1">+8</span>
          </div>
          <Link to="/leaderboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View Leaderboard
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mb-7">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/focus" className="block bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white hover:shadow-lg hover:shadow-indigo-200/50 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm font-bold">Start Focus Mode</p>
              <p className="text-xs text-indigo-200 mt-0.5">Enter distraction-free work zone with custom timer</p>
            </Link>
            <Link to="/chat" className="block bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold">AI Chat Scheduler</p>
              <p className="text-xs text-purple-200 mt-0.5">Let AI build your perfect daily routine</p>
            </Link>
          </div>
        </div>

        {/* Productivity Score */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">Productivity Score: <span className="text-indigo-600">94</span></span>
          </div>
          <div className="flex items-end gap-1.5 h-20 mb-2" role="img" aria-label="Productivity score bar chart showing trend over time">
            {productivityBars.map((height, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all duration-300 ${
                  i === productivityBars.length - 3
                    ? 'bg-indigo-600'
                    : i >= productivityBars.length - 3
                    ? 'bg-indigo-400'
                    : 'bg-indigo-200'
                }`}
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 text-center">Your highest productivity usually hits at 10:30 AM</p>
        </div>
      </aside>
    </div>
  )
}

export default Dashboard