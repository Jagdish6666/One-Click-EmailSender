require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
    console.log("Testing email configuration (Debug Mode)...");

    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`User: ${user}`);

    const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: {
            user: user,
            pass: pass,
        },
        logger: true,
        debug: true
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("SMTP Connection verified successfully!");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || user,
            to: process.env.EMAIL_FROM || user,
            subject: "Test Email from Certificate Sender (Debug)",
            text: "If you receive this, your email configuration works!",
        });
        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("Email sending failed:");
        console.error(error);
    }
}

main();
