import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

const LoginPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    })
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Mock login: save name to localStorage and redirect
        localStorage.setItem('user', JSON.stringify({ name: formData.fullName, email: formData.email }))
        navigate('/dashboard')
    }

    return (
        <div className="login-container">
            <div className="login-card animate-fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1>Welcome to MOMENTUM</h1>
                    <p>Your journey to peak productivity starts here</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        <span>Login</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="login-options">
                        <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
                    </div>

                    <div className="login-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="social-login-group">
                        <button type="button" className="social-button google" onClick={(e) => e.preventDefault()}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c3.01 0 5.53-.99 7.37-2.69l-3.57-2.77c-.99.66-2.23 1.06-3.8 1.06-2.91 0-5.38-1.97-6.26-4.62H2.18v2.84C4.03 20.2 7.72 23 12 23z" fill="#34A853" />
                                <path d="M5.74 13.98c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18V6.78H2.18C1.41 8.35 1 10.12 1 12s.41 3.65 1.18 5.22l3.56-2.84c-.24-.4-.44-.88-.56-1.4z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.43 2.09 14.89 1 12 1 7.72 1 4.03 3.8 2.18 7.68l3.56 2.84c.88-2.65 3.35-4.62 12-1 4.62z" fill="#EA4335" />
                            </svg>
                            <span>Google</span>
                        </button>
                        <button type="button" className="social-button facebook" onClick={(e) => e.preventDefault()}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Facebook</span>
                        </button>
                    </div>
                </form>

                <div className="login-footer">
                    <p>By signing in, you agree to our Terms of Service</p>
                </div>
            </div>

            {/* Background decorations */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>
        </div>
    )
}

export default LoginPage
