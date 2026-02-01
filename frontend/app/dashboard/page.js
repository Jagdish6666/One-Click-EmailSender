"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { getApiUrl, authHeaders, clearToken } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", email: "", eventName: "" })
  const [file, setFile] = useState(null)
  const [templateFile, setTemplateFile] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)

  const apiUrl = getApiUrl()

  useEffect(() => {
    fetchParticipants()
  }, [])

  async function fetchParticipants() {
    try {
      const res = await fetch(`${apiUrl}/api/participants`, {
        headers: authHeaders(),
      })
      if (res.status === 401) {
        clearToken()
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

  async function handleBulkUpload(e) {
    e.preventDefault()
    if (!file) return
    setError("")
    setSuccess("")
    setBulkLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${apiUrl}/api/participants/bulk`, {
        method: "POST",
        headers: {
          // Note: Don't set Content-Type for FormData, browser sets it with boundary
          Authorization: authHeaders().Authorization
        },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to upload file")
      } else {
        setSuccess(data.message)
        setFile(null)
        // Reset file input
        document.getElementById("excel-upload").value = ""
        fetchParticipants()

        // AUTO SEND: If backend suggests, trigger the send process immediately
        if (data.triggerSend) {
          handleSendCertificates()
        }
      }
    } catch (err) {
      console.error("Upload handler error:", err)
      setError("Failed to upload file. Please check if the backend is running.")
    }
    setBulkLoading(false)
  }

  async function handleTemplateUpload(e) {
    e.preventDefault()
    if (!templateFile) return
    setError("")
    setSuccess("")
    setTemplateLoading(true)

    const formData = new FormData()
    formData.append("template", templateFile)

    try {
      const res = await fetch(`${apiUrl}/api/settings/template`, {
        method: "POST",
        headers: {
          Authorization: authHeaders().Authorization
        },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to upload template")
      } else {
        setSuccess("Certificate template uploaded successfully! All future certificates will use this design.")
        setTemplateFile(null)
        document.getElementById("template-upload").value = ""
      }
    } catch (err) {
      setError("Failed to upload template")
    }
    setTemplateLoading(false)
  }

  async function handleAddParticipant(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setAddLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/participants`, {
        method: "POST",
        headers: authHeaders(),
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
      setSuccess("Participant added successfully.")
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
      const res = await fetch(`${apiUrl}/api/send-certificates`, {
        method: "POST",
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send")
        setSending(false)
        return
      }
      setSuccess(`Done. Sent: ${data.sent}, Failed: ${data.failed}`)
      fetchParticipants()
    } catch (err) {
      setError("Failed to send certificates")
    }
    setSending(false)
  }

  async function handleLogout() {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, { method: "POST" })
    } catch { }
    clearToken()
    router.push("/")
    router.refresh()
  }

  const pendingCount = participants.filter((p) => p.status === "PENDING").length
  const sentCount = participants.filter((p) => p.status === "SENT").length
  const failedCount = participants.filter((p) => p.status === "FAILED").length

  function getStatusStyle(status) {
    if (status === "SENT") return { ...styles.badge, background: "var(--color-success)", color: "white" }
    if (status === "FAILED") return { ...styles.badge, background: "var(--color-failed)", color: "white" }
    return { ...styles.badge, background: "var(--color-pending)", color: "white" }
  }

  return (
    <div style={styles.wrapper}>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Admin Dashboard</h1>
            <p style={styles.headerSub}>Manage participants and send certificates in one click.</p>
          </div>
          <button onClick={handleLogout} style={styles.logout}>Logout</button>
        </header>

        {error && <div style={styles.alertError}>{error}</div>}
        {success && <div style={styles.alertSuccess}>{success}</div>}

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{pendingCount}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{sentCount}</span>
            <span style={styles.statLabel}>Sent</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{failedCount}</span>
            <span style={styles.statLabel}>Failed</span>
          </div>
        </div>

        <section style={styles.section}>
          <h2 style={styles.h2}>Send Certificates</h2>
          <p style={styles.sectionP}>
            {pendingCount === 0
              ? "No pending participants. Add participants below, then click Send Certificates."
              : `${pendingCount} participant(s) pending. Click once to generate PDFs and send emails via SendGrid.`}
          </p>
          <button
            onClick={handleSendCertificates}
            disabled={sending || pendingCount === 0}
            style={pendingCount === 0 ? styles.primaryBtnDisabled : styles.primaryBtn}
          >
            {sending ? "Sending..." : "Send Certificates"}
          </button>
        </section>

        <section style={styles.section}>
          <div style={styles.headerRow}>
            <h2 style={styles.h2}>Certificate Template (Optional)</h2>
            <span style={styles.proBadge}>PRO</span>
          </div>
          <p style={styles.sectionP}>
            Upload a blank PDF certificate (without a name). We will automatically position the student's name in the center.
            If you don't upload one, we'll use our <strong>Premium Default Design</strong>.
          </p>
          <form onSubmit={handleTemplateUpload} style={styles.bulkForm}>
            <input
              id="template-upload"
              type="file"
              accept=".pdf"
              onChange={(e) => setTemplateFile(e.target.files[0])}
              style={styles.fileInput}
            />
            <button type="submit" disabled={templateLoading || !templateFile} style={templateFile ? styles.primaryBtn : styles.submitBtnDisabled}>
              {templateLoading ? "Uploading..." : "Save Template"}
            </button>
          </form>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Bulk Add (Excel)</h2>
          <p style={styles.sectionP}>Upload an Excel file with columns: <strong>Name, Email, Event</strong>.</p>
          <form onSubmit={handleBulkUpload} style={styles.bulkForm}>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.fileInput}
            />
            <button type="submit" disabled={bulkLoading || !file} style={file ? styles.submitBtn : styles.submitBtnDisabled}>
              {bulkLoading ? "Uploading..." : "Upload Excel"}
            </button>
          </form>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Add Participant</h2>
          <p style={styles.sectionP}>Add participant details. Certificate ID is generated automatically.</p>
          <form onSubmit={handleAddParticipant} style={styles.form}>
            <label style={styles.label}>Name</label>
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={styles.input}
            />
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              style={styles.input}
            />
            <label style={styles.label}>Event name</label>
            <input
              placeholder="e.g. Web Dev Workshop 2024"
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              required
              style={styles.input}
            />
            <button type="submit" disabled={addLoading} style={styles.submitBtn}>
              {addLoading ? "Adding..." : "Add Participant"}
            </button>
          </form>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Participants & Status</h2>
          <p style={styles.sectionP}>Delivery status: PENDING (not sent), SENT, or FAILED.</p>
          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : participants.length === 0 ? (
            <p style={styles.muted}>No participants yet. Add one above.</p>
          ) : (
            <div style={styles.tableWrap}>
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
                        <span style={getStatusStyle(p.status)}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: "100vh", background: "var(--color-background)" },
  main: { maxWidth: 960, margin: "0 auto", padding: 24 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 16,
  },
  h1: { fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" },
  headerSub: { fontSize: 15, color: "var(--color-text-muted)", marginTop: 4 },
  logout: {
    padding: "10px 20px",
    background: "var(--color-text-muted)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontWeight: 600,
    fontSize: 15,
  },
  alertError: {
    padding: 14,
    background: "var(--color-failed-bg)",
    color: "var(--color-failed)",
    borderRadius: "var(--radius)",
    marginBottom: 24,
    fontWeight: 500,
  },
  alertSuccess: {
    padding: 14,
    background: "var(--color-success-bg)",
    color: "var(--color-success)",
    borderRadius: "var(--radius)",
    marginBottom: 24,
    fontWeight: 500,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "var(--color-surface)",
    padding: 20,
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
    textAlign: "center",
  },
  statValue: { display: "block", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-primary)" },
  statLabel: { fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 },
  section: {
    background: "var(--color-surface)",
    padding: 28,
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow)",
    marginBottom: 24,
  },
  h2: { fontSize: "1.25rem", fontWeight: 700, marginBottom: 8, color: "var(--color-text)" },
  sectionP: { color: "var(--color-text-muted)", marginBottom: 20, fontSize: 15 },
  primaryBtn: {
    padding: "12px 24px",
    background: "var(--color-primary)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  headerRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  proBadge: {
    background: "#FFD700",
    color: "#000",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
  },
  primaryBtnDisabled: {
    padding: "14px 28px",
    background: "var(--color-text-muted)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 16,
    fontWeight: 600,
    opacity: 0.7,
    cursor: "not-allowed",
  },
  form: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 },
  bulkForm: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  fileInput: {
    padding: "8px",
    border: "2px dashed var(--color-border)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
  },
  submitBtnDisabled: {
    padding: 14,
    background: "var(--color-text-muted)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 16,
    fontWeight: 600,
    opacity: 0.6,
    cursor: "not-allowed",
  },
  label: { fontSize: 14, fontWeight: 600, color: "var(--color-text)" },
  input: {
    padding: 12,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: 16,
    background: "var(--color-surface)",
  },
  submitBtn: {
    padding: 14,
    background: "var(--color-text)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 16,
    fontWeight: 600,
    marginTop: 4,
  },
  muted: { color: "var(--color-text-muted)", fontSize: 15 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "2px solid var(--color-border)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--color-text-muted)",
  },
  td: { padding: "12px 14px", borderBottom: "1px solid var(--color-border)", fontSize: 15 },
  badge: {
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
}
