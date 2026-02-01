import "./globals.css"

export const metadata = {
  title: "Certificate Email Sender",
  description: "Send personalized certificates to participants with one click",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
