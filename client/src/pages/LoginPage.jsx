import React, { useState, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/UI/Logo'

const LoginPage = memo(() => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    })
    const navigate = useNavigate()

    const handleChange = useCallback((e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }, [])

    const handleSubmit = useCallback((e) => {
        e.preventDefault()
        localStorage.setItem('user', JSON.stringify({ name: formData.fullName, email: formData.email }))
        navigate('/dashboard')
    }, [formData.fullName, formData.email, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 sm:px-6">
            {/* Background blobs */}
            <div className="absolute -top-24 -right-24 w-125 h-125 bg-indigo-100/40 rounded-full blur-[80px] animate-[float_20s_infinite_alternate] pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-100 h-100 bg-pink-50/40 rounded-full blur-[80px] animate-[float_15s_infinite_alternate-reverse] pointer-events-none"></div>
            <div className="absolute top-[40%] left-[20%] w-75 h-75 bg-violet-50/40 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl p-8 sm:p-10 shadow-xl shadow-gray-200/30 z-10 animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-5">
                        <Logo size="md" showText={false} linkTo={null} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1.5">
                        Welcome to <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MOMENTUM</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Your journey to peak productivity starts here</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="fullName" className="text-sm font-semibold text-gray-600">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-600">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-sm font-semibold text-gray-600">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-2 py-3.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-200/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300/40 active:translate-y-0 transition-all duration-300 cursor-pointer"
                    >
                        <span>Login</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="flex justify-center pt-1">
                        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors" onClick={(e) => e.preventDefault()}>
                            Forgot Password?
                        </a>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or continue with</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2.5 py-3 border border-gray-200 rounded-xl bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            onClick={(e) => e.preventDefault()}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c3.01 0 5.53-.99 7.37-2.69l-3.57-2.77c-.99.66-2.23 1.06-3.8 1.06-2.91 0-5.38-1.97-6.26-4.62H2.18v2.84C4.03 20.2 7.72 23 12 23z" fill="#34A853" />
                                <path d="M5.74 13.98c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18V6.78H2.18C1.41 8.35 1 10.12 1 12s.41 3.65 1.18 5.22l3.56-2.84c-.24-.4-.44-.88-.56-1.4z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.43 2.09 14.89 1 12 1 7.72 1 4.03 3.8 2.18 7.68l3.56 2.84c.88-2.65 3.35-4.62 6.26-4.62z" fill="#EA4335" />
                            </svg>
                            <span>Google</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2.5 py-3 border border-gray-200 rounded-xl bg-white text-[#1877f2] text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            onClick={(e) => e.preventDefault()}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Facebook</span>
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-8">
                    By signing in, you agree to our <a href="#" className="text-indigo-500 hover:underline" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                </p>
            </div>
        </div>
    )
})

LoginPage.displayName = 'LoginPage'
export default LoginPage
