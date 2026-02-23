import React, { useState } from 'react'

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('global')

  const rankings = [
    {
      rank: 1,
      badge: '🥇',
      name: 'Sarah Jenkins',
      level: 'Level 14 Focus Master',
      avatar: 'SJ',
      avatarBg: 'bg-rose-400',
      streak: 24,
      tasks: 412,
      totalXP: '14,250',
      todayXP: '+240',
    },
    {
      rank: 2,
      badge: '🥈',
      name: 'Marcus Chen',
      level: 'Level 13 Focus Master',
      avatar: 'MC',
      avatarBg: 'bg-blue-400',
      streak: 18,
      tasks: 389,
      totalXP: '13,800',
      todayXP: '+240',
    },
    {
      rank: 3,
      badge: '🥉',
      name: 'Elena Rodriguez',
      level: 'Level 12 Focus Master',
      avatar: 'ER',
      avatarBg: 'bg-amber-400',
      streak: 12,
      tasks: 345,
      totalXP: '12,100',
      todayXP: '+240',
    },
    {
      rank: 4,
      badge: null,
      name: 'Alex Rivera',
      level: 'Level 11 Focus Master',
      avatar: 'AR',
      avatarBg: 'bg-indigo-400',
      streak: 7,
      tasks: 298,
      totalXP: '11,240',
      todayXP: '+240',
      isYou: true,
    },
    {
      rank: 5,
      badge: null,
      name: 'David Kim',
      level: 'Level 10 Focus Master',
      avatar: 'DK',
      avatarBg: 'bg-teal-400',
      streak: 15,
      tasks: 310,
      totalXP: '10,900',
      todayXP: '+240',
    },
  ]

  const achievements = [
    { icon: '⭐', label: 'PIONEER', unlocked: true },
    { icon: '🔥', label: 'STREAK KING', unlocked: true },
    { icon: '🧘', label: 'ZEN MASTER', unlocked: true },
    { icon: '🤝', label: 'COLLABORATOR', unlocked: true },
    { icon: '🌙', label: 'NIGHT OWL', unlocked: false },
    { icon: '🌅', label: 'EARLY BIRD', unlocked: false },
    { icon: '👑', label: 'ULTRA PRO', unlocked: false },
    { icon: '💪', label: 'IRON WILL', unlocked: false },
    { icon: '🎓', label: 'MENTOR', unlocked: false },
  ]

  return (
    <div className="px-8 py-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6 gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
              Active Season: Focus Fall
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              12 days remaining
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to the Hall of Focus</h1>
          <p className="text-sm text-gray-500">Compete with the community to earn exclusive badges and climb the ranks.<br/>Every focus minute counts towards your legacy.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3 text-right min-w-[220px]">
          <p className="text-xs font-bold text-indigo-700 mb-1.5">Season Goal: 50,000 Group XP</p>
          <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden mb-1" role="progressbar" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100} aria-label="Community XP progress">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
          </div>
          <p className="text-[11px] text-indigo-500">68% of community goal reached</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left - Community Rankings */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
            {/* Rankings Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Community Rankings</h2>
                  <p className="text-xs text-gray-400">Top performers this week based on validated focus tasks.</p>
                </div>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5" role="tablist" aria-label="Rankings scope">
                {['global', 'focus circle'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'focus circle' ? 'Focus Circle' : 'Global'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[60px_1fr_90px_90px_120px] text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 pb-3 border-b border-gray-100" aria-hidden="true">
              <span>Rank</span>
              <span>User</span>
              <span className="text-center">Streak</span>
              <span className="text-center">Tasks Done</span>
              <span className="text-right">Total XP</span>
            </div>

            {/* Rankings */}
            <div className="divide-y divide-gray-50" role="list" aria-label="Leaderboard rankings">
              {rankings.map((user) => (
                <div
                  key={user.rank}
                  role="listitem"
                  className={`grid grid-cols-[40px_1fr_auto] sm:grid-cols-[60px_1fr_90px_90px_120px] items-center px-4 py-3.5 transition-colors ${
                    user.isYou
                      ? 'bg-indigo-50/60 border-l-[3px] border-l-indigo-500 rounded-r-lg'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center">
                    {user.badge ? (
                      <span className="text-lg" aria-label={`Rank ${user.rank}`}>{user.badge}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-400 ml-1">{user.rank}th</span>
                    )}
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${user.avatarBg} rounded-full flex items-center justify-center text-white text-xs font-bold`} aria-hidden="true">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        {user.name}
                        {user.isYou && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">You</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400">{user.level}</p>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="text-center hidden sm:block">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500">
                      <span aria-hidden="true">🔥</span> {user.streak}d
                    </span>
                  </div>

                  {/* Tasks Done */}
                  <div className="text-center text-sm font-semibold text-gray-700 hidden sm:block">
                    {user.tasks}
                  </div>

                  {/* Total XP */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{user.totalXP}</p>
                    <p className="text-[11px] text-emerald-500 font-medium">
                      <span aria-hidden="true">•</span> {user.todayXP} today
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* View Full */}
            <div className="text-center pt-4 mt-2 border-t border-gray-100">
              <button className="text-sm font-semibold text-gray-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors">
                View Full Leaderboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom CTA Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Focus Duel */}
            <div className="bg-linear-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base mb-0.5">Start a Focus Duel</h3>
                  <p className="text-xs text-orange-100 mb-3">Challenge a friend to a 25-minute Pomodoro. Winner gets 2x bonus XP!</p>
                  <button className="bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-50 active:translate-y-0 transition-all">
                    Invite Duelist
                  </button>
                </div>
              </div>
            </div>

            {/* Study Group */}
            <div className="bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base mb-0.5">Join Study Group</h3>
                  <p className="text-xs text-indigo-200 mb-3">Collaborate on complex goals and earn shared milestone rewards.</p>
                  <button className="bg-white text-indigo-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-50 active:translate-y-0 transition-all">
                    Find Groups
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-5" aria-label="Your stats and achievements">
          {/* Your Standing */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Your Standing</h3>
              <span className="text-xs font-semibold text-gray-400">Rank #42</span>
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL XP</p>
                <p className="text-3xl font-extrabold text-gray-900">11,240</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NEXT LEVEL</p>
                <p className="text-lg font-bold text-indigo-600">12,500 XP</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Progress to Level 12</span>
                <span className="text-xs font-bold text-indigo-600">89%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={89} aria-valuemin={0} aria-valuemax={100} aria-label="Level progress">
                <div className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: '89%' }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-orange-500" aria-hidden="true">🔥</span>
                  <span className="text-xl font-extrabold text-indigo-700">7</span>
                </div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Day Streak</p>
              </div>
              <div className="bg-indigo-50 rounded-xl px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-indigo-500" aria-hidden="true">🏆</span>
                  <span className="text-xl font-extrabold text-indigo-700">12</span>
                </div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Badges</p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-base font-bold text-gray-900 mb-0.5">Achievements</h3>
            <p className="text-xs text-gray-400 mb-4">Visual milestones of your focus journey.</p>

            <div className="grid grid-cols-3 gap-3 mb-4" role="list" aria-label="Achievement badges">
              {achievements.map((badge, i) => (
                <div
                  key={i}
                  role="listitem"
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all ${
                    badge.unlocked
                      ? 'bg-gray-50 hover:bg-indigo-50'
                      : 'bg-gray-50/50 opacity-40'
                  }`}
                  aria-label={`${badge.label} badge${badge.unlocked ? ' (unlocked)' : ' (locked)'}`}
                >
                  <span className="text-xl mb-1" aria-hidden="true">{badge.icon}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-center leading-tight">{badge.label}</span>
                </div>
              ))}
            </div>

            <button className="w-full text-center text-xs font-semibold text-gray-500 hover:text-indigo-600 py-2 border border-gray-100 rounded-lg transition-colors">
              View All 24 Badges
            </button>
          </div>

          {/* AI Tip */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Users who engage in "Focus Duels" are 40% more likely to reach their weekly XP targets. Try challenging Sarah!
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Leaderboard