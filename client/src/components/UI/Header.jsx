import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
        : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
        }`}
      role="banner"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-2 group cursor-pointer"
            role="button"
            aria-label="Scroll to top"
          >
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200/50 group-hover:shadow-lg group-hover:shadow-indigo-300/50 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              MOMENTUM
            </span>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/login"
              className="px-5 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center"
            >
              <span>Login</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-24 pb-4 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
            <Link
              to="/login"
              className="px-4 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-center transition-all duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
