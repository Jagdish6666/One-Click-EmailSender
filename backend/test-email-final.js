require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
    console.log("Testing email with Port 465 + SSL (Secure) + IPv4 + Relaxed TLS...");

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true, // Force SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // Sometimes needed if network/cert store has issues
            rejectUnauthorized: false
        },
        // Force IPv4 to avoid potential IPv6 timeouts
        family: 4,
        logger: true,
        debug: true
    });

    try {
        console.log("Verifying connection to port 465...");
        await transporter.verify();
        console.log("SMTP Connection verified successfully!");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            subject: "Test Email (Final Check)",
            text: "Configuration works via Port 465 SSL.",
        });
        console.log("Email sent! ID:", info.messageId);
    } catch (error) {
        console.error("Failed:", error);
    }
}

main();
