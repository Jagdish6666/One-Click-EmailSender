import "./globals.css"

export const metadata = {
  title: "Single-Click Certificate Email Sender",
  description: "Automate certificate distribution for hackathons, workshops, webinars. Send personalized PDF certificates with one click.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
