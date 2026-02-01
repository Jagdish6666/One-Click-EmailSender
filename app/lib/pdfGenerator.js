// Certificate PDF generator using pdf-lib
// Creates a simple certificate with participant name, event, certificate ID, date
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

/**
 * Generate a certificate PDF as buffer (base64 for email attachment)
 * @param {Object} data - { name, eventName, certificateId }
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generateCertificatePDF({ name, eventName, certificateId }) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const titleSize = 28
  const bodySize = 14
  const gray = rgb(0.3, 0.3, 0.3)
  const black = rgb(0, 0, 0)

  // Title
  page.drawText("Certificate of Participation", {
    x: 120,
    y: 680,
    size: titleSize,
    font: fontBold,
    color: black,
  })

  // "This is to certify that"
  page.drawText("This is to certify that", {
    x: 180,
    y: 580,
    size: bodySize,
    font: font,
    color: gray,
  })

  // Participant name (prominent)
  page.drawText(name, {
    x: 180,
    y: 540,
    size: 22,
    font: fontBold,
    color: black,
  })

  // Event name
  page.drawText(`has participated in "${eventName}"`, {
    x: 180,
    y: 500,
    size: bodySize,
    font: font,
    color: gray,
  })

  // Certificate ID
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 180,
    y: 420,
    size: 12,
    font: font,
    color: gray,
  })

  // Date
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  page.drawText(`Date: ${today}`, {
    x: 180,
    y: 390,
    size: 12,
    font: font,
    color: gray,
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Convert PDF bytes to base64 string (for SendGrid attachment)
 */
export function pdfToBase64(pdfBytes) {
  return Buffer.from(pdfBytes).toString("base64")
}
