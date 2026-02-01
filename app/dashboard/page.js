"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", email: "", eventName: "" })

  // Fetch participants on load
  useEffect(() => {
    fetchParticipants()
  }, [])

  async function fetchParticipants() {
    try {
      const res = await fetch("/api/participants")
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const data = await res.json()
      setParticipants(Array.isArray(data) ? data : [])
    } catch (err) {
      setError("Failed to load participants")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddParticipant(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setAddLoading(true)
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to add")
        setAddLoading(false)
        return
      }
      setParticipants((prev) => [data, ...prev])
      setForm({ name: "", email: "", eventName: "" })
      setSuccess("Participant added")
    } catch (err) {
      setError("Failed to add participant")
    }
    setAddLoading(false)
  }

  async function handleSendCertificates() {
    setError("")
    setSuccess("")
    setSending(true)
    try {
      const res = await fetch("/api/send-certificates", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send")
        setSending(false)
        return
      }
      setSuccess(`Sent: ${data.sent}, Failed: ${data.failed}`)
      fetchParticipants()
    } catch (err) {
      setError("Failed to send certificates")
    }
    setSending(false)
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const pendingCount = participants.filter((p) => p.status === "PENDING").length

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logout}>
          Logout
        </button>
      </header>

      <section style={styles.section}>
        <h2 style={styles.h2}>Send Certificates</h2>
        <p style={styles.p}>
          {pendingCount} participant(s) pending. Click once to generate PDFs and send emails.
        </p>
        <button
          onClick={handleSendCertificates}
          disabled={sending || pendingCount === 0}
          style={{ ...styles.primaryButton, opacity: pendingCount === 0 ? 0.6 : 1 }}
        >
          {sending ? "Sending..." : "Send Certificates"}
        </button>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Add Participant</h2>
        <form onSubmit={handleAddParticipant} style={styles.form}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            style={styles.input}
          />
          <input
            placeholder="Event name"
            value={form.eventName}
            onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
            required
            style={styles.input}
          />
          <button type="submit" disabled={addLoading} style={styles.button}>
            {addLoading ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      <section style={styles.section}>
        <h2 style={styles.h2}>Participants</h2>
        {loading ? (
          <p>Loading...</p>
        ) : participants.length === 0 ? (
          <p style={styles.muted}>No participants yet. Add one above.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Certificate ID</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.email}</td>
                  <td style={styles.td}>{p.eventName}</td>
                  <td style={styles.td}>{p.certificateId}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background:
                          p.status === "SENT"
                            ? "#22c55e"
                            : p.status === "FAILED"
                            ? "#ef4444"
                            : "#f59e0b",
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

const styles = {
  main: { maxWidth: 900, margin: "0 auto", padding: 24 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  h1: { fontSize: "1.75rem" },
  logout: {
    padding: "8px 16px",
    background: "#666",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  section: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: 24,
  },
  h2: { fontSize: "1.25rem", marginBottom: 12 },
  p: { color: "#666", marginBottom: 16 },
  primaryButton: {
    padding: "12px 24px",
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  },
  form: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 },
  input: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    padding: 10,
    background: "#333",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  error: { color: "#c00", marginBottom: 12 },
  success: { color: "#22c55e", marginBottom: 12 },
  muted: { color: "#888" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #eee" },
  td: { padding: "10px 8px", borderBottom: "1px solid #eee" },
  badge: {
    padding: "4px 8px",
    borderRadius: 6,
    color: "white",
    fontSize: 12,
  },
}
