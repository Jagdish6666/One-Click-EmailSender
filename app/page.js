"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error("Auth check failed", err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="nav-brand">
          Certificate Sender
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          {!loading && !user && (
            <>
              <Link href="/login" className="nav-link">Login</Link>
              <Link href="/signup" className="btn-primary" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}>
                Sign up
              </Link>
            </>
          )}
          {!loading && user && (
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
          )}
        </div>
      </nav>

      <main className="hero-section">
        <h1 className="hero-title">
          Send Certificates <br />
          <span style={{ color: "var(--primary)" }}>in One Click</span>
        </h1>
        <p className="hero-text">
          Effortlessly generate and email personalized certificates to all your event participants.
          Upload CSV, choose a template, and send.
        </p>
        <div className="hero-actions">
          {!loading && !user && (
            <Link href="/login" className="btn-primary" style={{ minWidth: 160 }}>
              Get Started
            </Link>
          )}
          {!loading && user && (
            <Link href="/dashboard" className="btn-primary" style={{ minWidth: 160 }}>
              Dashboard
            </Link>
          )}
        </div>
      </main>
    </>
  )
}
