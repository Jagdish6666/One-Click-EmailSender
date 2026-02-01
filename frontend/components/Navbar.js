"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { clearToken } from "@/lib/api"

export default function Navbar() {
  const router = useRouter()

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link href="/" style={styles.logo}>Certificate Sender</Link>
        <div style={styles.links}>
          <Link href="/" style={styles.link}>Home</Link>
          <Link href="/login" style={styles.link}>Login</Link>
          <Link href="/signup" style={styles.linkBtn}>Sign up</Link>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: "var(--color-surface)",
    boxShadow: "var(--shadow)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--color-primary)",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  link: {
    padding: "8px 16px",
    color: "var(--color-text)",
    fontSize: 15,
    fontWeight: 500,
  },
  linkBtn: {
    padding: "8px 18px",
    background: "var(--color-primary)",
    color: "white",
    borderRadius: "var(--radius)",
    fontSize: 15,
    fontWeight: 600,
  },
  logoutBtn: {
    padding: "8px 18px",
    background: "var(--color-text-muted)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 15,
    fontWeight: 500,
  },
}
