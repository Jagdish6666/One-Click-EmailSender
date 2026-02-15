"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getApiUrl, authHeaders, clearToken, getToken } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", email: "", eventName: "" })

  // Settings State
  const [settings, setSettings] = useState({ nameX: 0, nameY: 0, nameSize: 40 })
  const [templateFile, setTemplateFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // Bulk Upload State
  const [excelFile, setExcelFile] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Fetch data on load
  useEffect(() => {
    async function init() {
      await Promise.all([fetchParticipants(), fetchSettings()])
      setLoading(false)
    }
    init()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch(`${getApiUrl()}/api/settings/info`)
      if (res.ok) {
        const data = await res.json()
        if (data.settings) setSettings(data.settings)
      }
    } catch (e) {
      console.error("Failed to fetch settings", e)
    }
  }

  async function fetchParticipants() {
    try {
      const headers = authHeaders()
      if (!headers.Authorization) {
        router.push("/login")
        return
      }

      const res = await fetch(`${getApiUrl()}/api/participants`, {
        headers: headers
      })

      if (res.status === 401) {
        clearToken()
        router.push("/login")
        return
      }

      if (!res.ok) {
        // Handle non-401 errors without redirecting immediately or throwing
        // Only throw if critical
      } else {
        const data = await res.json()
        setParticipants(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      setError("Failed to load participants")
    }
  }

  async function handleAddParticipant(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setAddLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/participants`, {
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
      const res = await fetch(`${getApiUrl()}/api/send-certificates`, {
        method: "POST",
        headers: authHeaders()
      })
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

  async function handleUploadTemplate(e) {
    e.preventDefault()
    if (!templateFile) return
    setError("")
    setSuccess("")
    setUploading(true)

    const formData = new FormData()
    formData.append("template", templateFile)

    try {
      const res = await fetch(`${getApiUrl()}/api/settings/template`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok) setSuccess("Template uploaded successfully!")
      else setError(data.error || "Upload failed")
    } catch (e) {
      setError("Upload error")
    }
    setUploading(false)
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSavingSettings(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/settings/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) setSuccess("Settings saved successfully!")
      else setError("Save failed")
    } catch (e) {
      setError("Save error")
    }
    setSavingSettings(false)
  }

  async function handleBulkUpload(e) {
    e.preventDefault()
    if (!excelFile) return
    setError("")
    setSuccess("")
    setBulkLoading(true)

    const formData = new FormData()
    formData.append("file", excelFile)

    try {
      const token = getToken()
      const res = await fetch(`${getApiUrl()}/api/participants/bulk`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(data.message || "Bulk upload successful")
        setExcelFile(null)
        // Reset file input if possible or just rely on state
        fetchParticipants()
      } else {
        setError(data.error || "Bulk upload failed")
      }
    } catch (err) {
      setError("Bulk upload error: " + err.message)
    }
    setBulkLoading(false)
  }

  async function handleLogout() {
    clearToken()
    router.push("/login")
    router.refresh()
  }

  const pendingCount = participants.filter((p) => p.status === "PENDING").length

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 40 }}>
      {/* Header */}
      <header className="header-container">
        <h1 className="title" style={{ textAlign: "left", margin: 0 }}>
          Admin Dashboard
        </h1>
        <button onClick={handleLogout} className="btn-primary" style={{ width: "auto" }}>
          Logout
        </button>
      </header>

      {/* Error/Success Messages */}
      {error && <p className="error-msg" style={{ marginBottom: 20 }}>{error}</p>}
      {success && (
        <p className="error-msg" style={{ background: "rgba(34, 197, 94, 0.2)", borderColor: "rgba(34, 197, 94, 0.4)", color: "#4ade80", marginBottom: 20 }}>
          {success}
        </p>
      )}

      {/* Row 1: Send & Template Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

        {/* Send Certificates Card */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left" }}>
            Send Certificates
          </h2>
          <p className="subtitle" style={{ textAlign: "left", marginBottom: 20 }}>
            {pendingCount} participant(s) pending.
          </p>
          <button
            onClick={handleSendCertificates}
            disabled={sending || pendingCount === 0}
            className="btn-primary"
            style={{ width: "auto", opacity: pendingCount === 0 ? 0.6 : 1 }}
          >
            {sending ? "Sending..." : "Send All Pending"}
          </button>
        </section>

        {/* Template Settings Card */}
        {/* Template Settings Card */}
        <section className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left", marginBottom: 20 }}>
            Template Settings
          </h2>

          {/* PDF Upload Section */}
          <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Upload Certificate PDF</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setTemplateFile(e.target.files[0])}
                className="input-field"
                style={{ padding: '10px', height: 'auto' }}
              />
              <button
                onClick={handleUploadTemplate}
                disabled={!templateFile || uploading}
                className="btn-primary"
                style={{ width: '100%', marginTop: '5px' }}
              >
                {uploading ? 'Uploading...' : 'Upload Template'}
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Name X Pos</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.nameX}
                  onChange={(e) => setSettings({ ...settings, nameX: parseFloat(e.target.value) })}
                  style={{ height: '45px' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Name Y Pos</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.nameY}
                  onChange={(e) => setSettings({ ...settings, nameY: parseFloat(e.target.value) })}
                  style={{ height: '45px' }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Font Size (px)</label>
              <input
                type="number"
                className="input-field"
                value={settings.nameSize}
                onChange={(e) => setSettings({ ...settings, nameSize: parseFloat(e.target.value) })}
                style={{ height: '45px' }}
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary"
              style={{ marginTop: '10px', width: '100%', height: '45px' }}
            >
              {savingSettings ? "Saving..." : "Save Configuration"}
            </button>
          </form>
        </section>
      </div>

      {/* Add Participant Card */}


      {/* Row 2: Participant Management */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

        {/* Add Single Participant */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left", marginBottom: 20 }}>
            Add Participant
          </h2>
          <form onSubmit={handleAddParticipant} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Full Name</label>
              <input
                placeholder="Ex. John Doe"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="input-field"
                style={{ height: '45px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Email Address</label>
              <input
                type="email"
                placeholder="Ex. john@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="input-field"
                style={{ height: '45px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Event Name</label>
              <input
                placeholder="Ex. Hackathon 2024"
                value={form.eventName}
                onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                required
                className="input-field"
                style={{ height: '45px' }}
              />
            </div>

            <button
              type="submit"
              disabled={addLoading}
              className="btn-primary"
              style={{ marginTop: '10px', width: '100%', height: '45px' }}
            >
              {addLoading ? "Adding Participant..." : "Add Participant"}
            </button>
          </form>
        </section>

        {/* Bulk Import */}
        <section className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 className="title" style={{ fontSize: "1.5rem", textAlign: "left", marginBottom: 20 }}>
            Bulk Import (Excel)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <p className="subtitle" style={{ textAlign: "left", marginBottom: 8, fontSize: '0.9rem' }}>
                Supported columns: <strong>Name, Email, Event</strong>
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setExcelFile(e.target.files[0])}
                className="input-field"
                style={{ padding: '10px', height: 'auto', width: '100%' }}
              />
            </div>

            <button
              onClick={handleBulkUpload}
              disabled={!excelFile || bulkLoading}
              className="btn-primary"
              style={{ width: '100%', height: '45px' }}
            >
              {bulkLoading ? 'Processing Request...' : 'Import Participants from Excel'}
            </button>
          </div>
        </section>
      </div>

      {/* Participants List */}
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
    </main >
  )
}
