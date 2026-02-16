require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
    console.log("Testing email with direct IP to bypass DNS issues...");

    // Hardcoded IP for smtp-relay.brevo.com (from previous successful net test)
    // But ideally we should resolve dynamically if it changes.
    // For this test, let's use the one we saw: 1.179.116.1
    const hostIP = '1.179.116.1';

    const transporter = nodemailer.createTransport({
        host: hostIP,
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
            servername: 'smtp-relay.brevo.com' // Important for TLS SNI
        },
        logger: true,
        debug: true
    });

    try {
        console.log(`Connecting to ${hostIP}:587...`);
        await transporter.verify();
        console.log("SMTP Connection verified successfully!");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            subject: "Test Email via IP",
            text: "If you see this, DNS was likely the issue.",
        });
        console.log("Email sent! ID:", info.messageId);
    } catch (error) {
        console.error("Failed:", error);
    }
}

main();
