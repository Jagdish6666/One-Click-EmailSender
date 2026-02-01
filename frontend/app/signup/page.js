"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { getApiUrl, setToken } from "@/lib/api"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Signup failed")
        setLoading(false)
        return
      }
      setToken(data.token)
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <Navbar />
      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Sign up</h1>
          <p style={styles.subtitle}>Create an admin account to manage participants and send certificates.</p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Name (optional)</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
          <p style={styles.footer}>
            Have an account? <Link href="/login" style={styles.footerLink}>Login</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: "100vh", background: "var(--color-background)" },
  main: {
    minHeight: "calc(100vh - 60px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    background: "var(--color-surface)",
    padding: 40,
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    width: "100%",
    maxWidth: 400,
  },
  h1: { fontSize: "1.75rem", fontWeight: 700, marginBottom: 8, color: "var(--color-text)" },
  subtitle: { fontSize: 15, color: "var(--color-text-muted)", marginBottom: 28 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  label: { fontSize: 14, fontWeight: 600, color: "var(--color-text)" },
  input: {
    padding: 12,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: 16,
    background: "var(--color-surface)",
  },
  error: { color: "var(--color-failed)", fontSize: 14 },
  button: {
    padding: 14,
    background: "var(--color-primary)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 16,
    fontWeight: 600,
    marginTop: 8,
  },
  footer: { marginTop: 24, fontSize: 15, color: "var(--color-text-muted)", textAlign: "center" },
  footerLink: { color: "var(--color-primary)", fontWeight: 600 },
}
