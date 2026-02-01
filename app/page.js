"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>Certificate Sender</Link>
        <div style={styles.links}>
          <Link href="/" style={styles.linkActive}>Home</Link>
          <Link href="/login" style={styles.link}>Login</Link>
          <Link href="/signup" style={styles.link}>Sign up</Link>
        </div>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.title}>Send Certificates in One Click</h1>
        <p style={styles.subtitle}>
          Add participants, click once. We generate PDFs and email them automatically.
        </p>
        <div style={styles.actions}>
          <Link href="/login" style={styles.primaryBtn}>Get Started</Link>
          <Link href="/dashboard" style={styles.secondaryBtn}>Dashboard</Link>
        </div>
      </main>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#4f46e5",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  link: {
    padding: "8px 16px",
    color: "#475569",
    fontSize: 15,
    textDecoration: "none",
  },
  linkActive: {
    padding: "8px 16px",
    color: "#4f46e5",
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
  logoutBtn: {
    padding: "8px 16px",
    background: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    cursor: "pointer",
  },
  main: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "80px 24px",
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 16,
    lineHeight: 1.25,
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#64748b",
    marginBottom: 32,
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  primaryBtn: {
    display: "inline-block",
    padding: "14px 28px",
    background: "#4f46e5",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 16,
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "14px 28px",
    background: "#fff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 16,
  },
}
