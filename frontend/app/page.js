"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getApiUrl, authHeaders, setToken } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("login")

  // Form states for the landing page auth card
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  async function handleAuth(e) {
    e.preventDefault()
    setAuthError("")
    setAuthLoading(true)

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const payload = activeTab === 'login'
      ? { email, password }
      : { email, password, name }

    try {
      const res = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setAuthError(data.error || "Authentication failed")
        setAuthLoading(false)
        return
      }

      if (data.token) {
        setToken(data.token)
        window.location.href = "/dashboard" // Force refresh to update auth state
      }
    } catch (err) {
      setAuthError("Something went wrong. Please try again.")
      setAuthLoading(false)
    }
  }

  return (
    <main className="page-container">
      <div className="split-layout">
        {/* Left Panel */}
        <div className="hero-content">
          <div className="brand-logo">
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
              </svg>
            </div>
            <span>CertificateSender</span>
          </div>

          <h1 className="hero-title">
            Advanced <br />
            <span className="text-gradient">Certificate Sending</span> for <br />
            Modern Teams.
          </h1>

          <p className="hero-description">
            Real-Time Certificate Generation & Email System powered by next-gen bulk processing algorithms.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <span>Real-time delivery</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span>Custom Templates</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <span>Secure Authentication</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <span>REST API Access</span>
            </div>
          </div>

          <div className="social-proof">
            <div className="avatars">
              {/* Placeholder Avatars */}
              <div className="avatar" style={{ backgroundColor: '#FF5733' }}></div>
              <div className="avatar" style={{ backgroundColor: '#33FF57' }}></div>
              <div className="avatar" style={{ backgroundColor: '#3357FF' }}></div>
            </div>
            <p className="proof-text">Joined by <strong>2,400+</strong> enterprises globally</p>
          </div>
        </div>

        {/* Right Panel - Auth Card */}
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-tabs">
              <button
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setAuthError(""); }}
              >
                Login
              </button>
              <button
                className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => { setActiveTab('signup'); setAuthError(""); }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuth}>
              {activeTab === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {authError && <p className="error-msg" style={{ marginBottom: '20px' }}>{authError}</p>}

              {activeTab === 'login' && (
                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={authLoading}>
                {authLoading ? 'Processing...' : (activeTab === 'login' ? 'Sign In to Dashboard' : 'Get Started Now')}
              </button>

              <div className="divider">OR CONTINUE WITH</div>

              <div className="social-buttons">
                <button type="button" className="btn-social">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Google
                </button>
                <button type="button" className="btn-social">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  SSO
                </button>
              </div>
            </form>


            <div className="footer-secure">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              END-TO-END ENCRYPTED PROTECTION
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
