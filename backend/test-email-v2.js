require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
    console.log("Testing email with IPv4 forced...");

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_PORT === "465",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            ciphers: 'SSLv3', // Sometimes helps with old servers/proxies, but Brevo is modern.
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
        greetingTimeout: 5000,
        logger: true,
        debug: true
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("SMTP Connection verified successfully!");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            subject: "Test Email (IPv4 forced)",
            text: "Configuration works.",
        });
        console.log("Email sent! ID:", info.messageId);
    } catch (error) {
        console.error("Failed:", error);
    }
}

main();
