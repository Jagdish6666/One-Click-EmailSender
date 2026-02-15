/**
 * @file send-certificates.js
 * @description Core endpoint for bulk processing: fetches PENDING participants, generates PDFs, sends emails, and updates status.
 */

const express = require("express");
const { prisma } = require("../lib/prisma");
const { generateCertificatePDF, pdfToBase64 } = require("../lib/pdfGenerator");
const { sendEmail } = require("../lib/mailer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

/**
 * POST /api/send-certificates
 * @description Triggers the bulk certificate generation and email sending process.
 */
router.post("/", async (req, res) => {
  // Safety check: Ensure SMTP credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ error: "Email credentials (EMAIL_USER, EMAIL_PASS) are not set in .env" });
  }

  try {
    // 1. Fetch all participants with status 'PENDING'
    // This prevents sending duplicate emails to already processed participants.
    const pendingParticipants = await prisma.participant.findMany({
      where: { status: "PENDING" },
    });

    if (pendingParticipants.length === 0) {
      return res.json({
        message: "No pending participants to process.",
        sent: 0,
        failed: 0,
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    // 2. Loop through each participant and process them individually
    for (const participant of pendingParticipants) {
      try {
        // A. Generate personalized certificate PDF as a buffer
        const pdfBytes = await generateCertificatePDF({
          name: participant.name,
          eventName: participant.eventName,
          certificateId: participant.certificateId,
        });

        // B. Convert PDF bytes to Base64 for email attachment
        const base64Pdf = pdfToBase64(pdfBytes);

        // C. Send the email via SendGrid
        await sendEmail({
          to: participant.email,
          subject: `Your Certificate for ${participant.eventName}`,
          text: `Hi ${participant.name},\n\nCongratulations! Attached is your certificate for "${participant.eventName}".\n\nCertificate ID: ${participant.certificateId}`,
          html: `<p>Hi ${participant.name},</p><p>Congratulations! Attached is your certificate for "<strong>${participant.eventName}</strong>".</p><p>Certificate ID: <code>${participant.certificateId}</code></p>`,
          attachment: {
            content: base64Pdf,
            filename: `Certificate_${participant.name.replace(/\s+/g, "_")}.pdf`
          },
        });

        // D. Update database status to 'SENT' upon success
        await prisma.participant.update({
          where: { id: participant.id },
          data: { status: "SENT" },
        });

        sentCount++;
      } catch (err) {
        // E. Log failure and update status to 'FAILED'
        // This allows the admin to retry only the failed ones later.
        console.error(`Error processing participant ${participant.email}:`, err);

        await prisma.participant.update({
          where: { id: participant.id },
          data: { status: "FAILED" },
        });

        failedCount++;
      }
      // F. The process continues even if one email fails
    }

    // 3. Return a final summary report
    res.json({
      success: true,
      message: `Bulk process complete. Sent: ${sentCount}, Failed: ${failedCount}`,
      summary: {
        totalProcessed: pendingParticipants.length,
        sent: sentCount,
        failed: failedCount,
      }
    });

  } catch (err) {
    console.error("Bulk processing error:", err);
    res.status(500).json({ error: "Internal server error during bulk processing" });
  }
});

module.exports = router;
