// SendGrid email helper - uses API key from env
import sgMail from "@sendgrid/mail"

// Initialize with API key (set in .env as SENDGRID_API_KEY)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

/**
 * Send email with optional PDF attachment
 * @param {Object} options - { to, subject, text, html, attachment }
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body (optional)
 * @param {Object} [options.attachment] - { content: base64, filename }
 */
export async function sendEmail({ to, subject, text, html, attachment }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
    subject,
    text,
    html: html || text,
  }
  if (attachment) {
    msg.attachments = [
      {
        content: attachment.content,
        filename: attachment.filename,
        type: "application/pdf",
        disposition: "attachment",
      },
    ]
  }
  const result = await sgMail.send(msg)
  return result
}
