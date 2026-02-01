import { NextResponse } from "next/server"
import { getSession } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { generateCertificatePDF, pdfToBase64 } from "@/app/lib/pdfGenerator"
import { sendEmail } from "@/app/lib/mailer"

export async function POST() {
  // const user = await getSession()
  // if (!user) {
  //   return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  // }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json(
      { error: "Email credentials not set in .env" },
      { status: 500 }
    )
  }

  try {
    // Only fetch PENDING - prevents duplicate sending
    const pending = await prisma.participant.findMany({
      where: { status: "PENDING" },
    })

    if (pending.length === 0) {
      return NextResponse.json({
        message: "No pending participants to send certificates to",
        sent: 0,
        failed: 0,
      })
    }

    let sentCount = 0
    let failedCount = 0

    for (const p of pending) {
      try {
        // 1. Generate PDF
        const pdfBytes = await generateCertificatePDF({
          name: p.name,
          eventName: p.eventName,
          certificateId: p.certificateId,
        })
        const base64Pdf = pdfToBase64(pdfBytes)

        // 2. Send email with attachment
        await sendEmail({
          to: p.email,
          subject: `Your Certificate - ${p.eventName}`,
          text: `Dear ${p.name},\n\nPlease find your certificate of participation for "${p.eventName}" attached.\n\nCertificate ID: ${p.certificateId}\n\nBest regards`,
          html: `<p>Dear ${p.name},</p><p>Please find your certificate of participation for "<strong>${p.eventName}</strong>" attached.</p><p>Certificate ID: <code>${p.certificateId}</code></p><p>Best regards</p>`,
          attachment: {
            content: base64Pdf,
            filename: `Certificate_${p.name.replace(/\s+/g, "_")}.pdf`,
          },
        })

        // 3. Update status to SENT
        await prisma.participant.update({
          where: { id: p.id },
          data: { status: "SENT" },
        })
        sentCount++
      } catch (err) {
        console.error(`Failed to send certificate to ${p.email}:`, err)
        await prisma.participant.update({
          where: { id: p.id },
          data: { status: "FAILED" },
        })
        failedCount++
      }
    }

    return NextResponse.json({
      message: `Sent: ${sentCount}, Failed: ${failedCount}`,
      sent: sentCount,
      failed: failedCount,
      total: pending.length,
    })
  } catch (err) {
    console.error("Send certificates error:", err)
    return NextResponse.json({ error: "Failed to send certificates" }, { status: 500 })
  }
}
