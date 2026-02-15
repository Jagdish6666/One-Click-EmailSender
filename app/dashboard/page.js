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
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 40 }}>
      <header className="header-container">
        <h1 className="title" style={{ textAlign: "left", margin: 0 }}>
          Admin Dashboard
        </h1>
        <button onClick={handleLogout} className="btn-primary" style={{ width: "auto" }}>
          Logout
        </button>
      </header>

      <section className="card">
        <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left" }}>
          Send Certificates
        </h2>
        <p className="subtitle" style={{ textAlign: "left", marginBottom: 20 }}>
          {pendingCount} participant(s) pending. Click once to generate PDFs and send emails.
        </p>
        <button
          onClick={handleSendCertificates}
          disabled={sending || pendingCount === 0}
          className="btn-primary"
          style={{ width: "auto", opacity: pendingCount === 0 ? 0.6 : 1 }}
        >
          {sending ? "Sending..." : "Send Certificates"}
        </button>
      </section>

      <section className="card">
        <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left", marginBottom: 20 }}>
          Add Participant
        </h2>
        <form onSubmit={handleAddParticipant} className="form-group" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="input-field"
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="input-field"
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              placeholder="Event name"
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              required
              className="input-field"
            />
          </div>
          <button type="submit" disabled={addLoading} className="btn-primary" style={{ width: "auto", minWidth: 100 }}>
            {addLoading ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      {error && <p className="error-msg" style={{ marginBottom: 20 }}>{error}</p>}
      {success && (
        <p className="error-msg" style={{ background: "rgba(34, 197, 94, 0.2)", borderColor: "rgba(34, 197, 94, 0.4)", color: "#4ade80", marginBottom: 20 }}>
          {success}
        </p>
      )}

      <section className="card">
        <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left", marginBottom: 20 }}>
          Participants
        </h2>
        {loading ? (
          <p className="subtitle" style={{ textAlign: "left" }}>Loading...</p>
        ) : participants.length === 0 ? (
          <p className="subtitle" style={{ textAlign: "left" }}>No participants yet. Add one above.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Certificate ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.eventName}</td>
                    <td>{p.certificateId}</td>
                    <td>
                      <span className={`status-badge ${p.status === "SENT" ? "status-sent" :
                          p.status === "FAILED" ? "status-failed" : "status-pending"
                        }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
