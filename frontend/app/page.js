import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function Home() {
  return (
    <div style={styles.wrapper}>
      <Navbar />
      <main>
        {/* Hero */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>Single-Click Certificate Email Sender</h1>
            <p style={styles.heroSubtitle}>
              Automate certificate distribution for hackathons, workshops, webinars, and training programs.
              Send personalized PDF certificates to all participants with one click.
            </p>
            <div style={styles.heroButtons}>
              <Link href="/login" style={styles.ctaPrimary}>Login</Link>
              <Link href="/signup" style={styles.ctaSecondary}>Sign up</Link>
              <Link href="/dashboard" style={styles.ctaOutline}>Dashboard</Link>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.sectionTitle}>The Problem</h2>
            <p style={styles.sectionIntro}>
              In colleges, hackathons, workshops, webinars, and training programs, organizers often need to send certificates to hundreds of participants.
            </p>
            <ul style={styles.problemList}>
              <li style={styles.problemListItem}>Manual email sending is time-consuming</li>
              <li style={styles.problemListItem}>Gmail does not support dynamic attachments per user</li>
              <li style={styles.problemListItem}>High chance of mistakes (wrong name, missing attachment)</li>
              <li style={styles.problemListItem}>No tracking of who received certificates</li>
              <li style={styles.problemListItem}>No retry mechanism for failed emails</li>
            </ul>
          </div>
        </section>

        {/* Solution */}
        <section style={styles.sectionAlt}>
          <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Our Solution</h2>
            <p style={styles.sectionIntro}>
              A centralized platform where the admin adds participant details, certificates are generated automatically, and emails are sent in bulk with full status tracking.
            </p>
            <div style={styles.featureGrid}>
              <div style={styles.featureCard}>
                <span style={styles.featureIcon}>📋</span>
                <h3 style={styles.featureTitle}>Participant Management</h3>
                <p style={styles.featureText}>Store name, email, event name, certificate ID, and sending status securely in the database.</p>
              </div>
              <div style={styles.featureCard}>
                <span style={styles.featureIcon}>📄</span>
                <h3 style={styles.featureTitle}>Certificate Generation</h3>
                <p style={styles.featureText}>Unique PDF for each participant with name, event, certificate ID, and date inserted dynamically.</p>
              </div>
              <div style={styles.featureCard}>
                <span style={styles.featureIcon}>✉️</span>
                <h3 style={styles.featureTitle}>Automated Emails</h3>
                <p style={styles.featureText}>SendGrid integration: personalized email with PDF attachment for every participant.</p>
              </div>
              <div style={styles.featureCard}>
                <span style={styles.featureIcon}>✅</span>
                <h3 style={styles.featureTitle}>Status Tracking</h3>
                <p style={styles.featureText}>Track Sent / Failed for each participant. No duplicate sends; retry failed ones if needed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <ol style={styles.workflowList}>
              <li>Admin logs into the system</li>
              <li>Admin adds participant details</li>
              <li>Participant data is saved in the database</li>
              <li>Admin clicks &quot;Send Certificates&quot;</li>
              <li>System generates certificate PDFs</li>
              <li>System sends emails with attachments</li>
              <li>System updates delivery status</li>
              <li>Admin views final report</li>
            </ol>
            <div style={styles.workflowCta}>
              <Link href="/login" style={styles.ctaPrimary}>Get Started</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.container}>
            <p style={styles.footerText}>Single-Click Certificate Email Sender — Automated, scalable certificate distribution for real-world events.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: "100vh", background: "var(--color-background)" },
  hero: {
    background: "linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)",
    color: "white",
    padding: "64px 24px 80px",
    textAlign: "center",
  },
  heroContent: { maxWidth: 720, margin: "0 auto" },
  heroTitle: {
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
    fontWeight: 700,
    marginBottom: 16,
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: "1.125rem",
    opacity: 0.95,
    marginBottom: 32,
    lineHeight: 1.7,
  },
  heroButtons: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  ctaPrimary: {
    display: "inline-block",
    padding: "12px 24px",
    background: "white",
    color: "var(--color-primary)",
    borderRadius: "var(--radius)",
    fontWeight: 600,
    fontSize: 16,
  },
  ctaSecondary: {
    display: "inline-block",
    padding: "12px 24px",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "2px solid white",
    borderRadius: "var(--radius)",
    fontWeight: 600,
    fontSize: 16,
  },
  ctaOutline: {
    display: "inline-block",
    padding: "12px 24px",
    background: "transparent",
    color: "white",
    border: "2px solid rgba(255,255,255,0.8)",
    borderRadius: "var(--radius)",
    fontWeight: 600,
    fontSize: 16,
  },
  section: { padding: "48px 24px", background: "var(--color-background)" },
  sectionAlt: { padding: "48px 24px", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" },
  container: { maxWidth: 900, margin: "0 auto" },
  sectionTitle: { fontSize: "1.75rem", fontWeight: 700, marginBottom: 16, color: "var(--color-text)" },
  sectionIntro: { fontSize: "1rem", color: "var(--color-text-muted)", marginBottom: 24, lineHeight: 1.7 },
  problemList: {
    listStyle: "disc",
    paddingLeft: 24,
    margin: 0,
  },
  problemListItem: {
    padding: "8px 0",
    color: "var(--color-text-muted)",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 24,
    marginTop: 32,
  },
  featureCard: {
    background: "var(--color-background)",
    padding: 24,
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
  },
  featureIcon: { fontSize: 28, marginBottom: 12, display: "block" },
  featureTitle: { fontSize: "1.125rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text)" },
  featureText: { fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.6 },
  workflowList: {
    listStyle: "decimal",
    paddingLeft: 24,
    color: "var(--color-text-muted)",
    lineHeight: 2,
    marginBottom: 32,
  },
  workflowCta: { textAlign: "center" },
  footer: {
    padding: "32px 24px",
    background: "var(--color-text)",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  footerText: { fontSize: 14, maxWidth: 600, margin: "0 auto" },
}
