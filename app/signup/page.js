"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
      const res = await fetch("/api/auth/signup", {
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
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Sign up</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
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
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  )
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "white",
    padding: 32,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: 360,
  },
  h1: { marginBottom: 24, fontSize: "1.5rem" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  input: {
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 16,
  },
  error: { color: "#c00", fontSize: 14 },
  button: {
    padding: 12,
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  },
  footer: { marginTop: 16, fontSize: 14, color: "#666" },
}
