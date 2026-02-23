import React from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Task Management",
      description: "Organize your tasks efficiently with smart categorization and priority levels."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Time Tracking",
      description: "Monitor how you spend your time and optimize your daily routines."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Progress Analytics",
      description: "Visualize your achievements with detailed insights and AI-powered reports."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Wellness Tracking",
      description: "Balance work and life with mood tracking and wellness reminders."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Smart Calendar",
      description: "AI-synced scheduling that adapts to your energy and priorities."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Focus Mode",
      description: "Immersive distraction-free sessions with Pomodoro timer and streak tracking."
    }
  ]


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-600px h-600px bg-linear-to-br from-indigo-200/40 via-purple-200/30 to-pink-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-purple-100/50 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative z-10 animate-fade-in">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-full mb-10 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-sm font-semibold text-indigo-600 tracking-wide">Your Personal Productivity Partner</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Transform Your
              <span className="block mt-2 bg-linear-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Daily Routine
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">
              MOMENTUM helps you organize tasks, track habits, and achieve your goals with a beautiful,
              intuitive interface designed for modern life.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group w-full sm:w-auto px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <span>Get Started Free</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Watch Demo</span>
              </button>
            </div>


            {/* Scroll indicator */}
            <div className="mt-12 animate-bounce">
              <svg className="w-6 h-6 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-50/60 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-full mb-6 shadow-sm">
              <span className="text-sm font-semibold text-indigo-600 tracking-wide">Why MOMENTUM?</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-[1.1] tracking-tight">
              Everything You Need to
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Powerful features designed to help you take control of your life and achieve your personal best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-7 bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-2xl hover:bg-linear-to-br hover:from-indigo-500 hover:to-purple-600 hover:border-transparent hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 bg-indigo-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center text-indigo-600 group-hover:text-white transition-all duration-300 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-white mb-2.5 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-500 group-hover:text-indigo-100 leading-relaxed transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-500px h-500px bg-linear-to-br from-indigo-100/50 via-purple-100/40 to-pink-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 left-20 w-40 h-40 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-20 w-52 h-52 bg-purple-100/40 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-indigo-200">
            {/* Decorative circles inside card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-[1.1] tracking-tight">
                Ready to Transform Your Life?
              </h2>
              <p className="text-lg text-indigo-100 mb-10 max-w-md mx-auto leading-relaxed">
                Join thousands of users who have already improved their productivity and well-being with MOMENTUM.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="group px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 inline-flex items-center gap-3"
              >
                <span>Start Your Journey Today</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home