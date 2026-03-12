require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
    console.log("=== SMTP Email Test ===");
    console.log("HOST:", process.env.EMAIL_HOST);
    console.log("PORT:", process.env.EMAIL_PORT);
    console.log("USER:", process.env.EMAIL_USER);
    console.log("FROM:", process.env.EMAIL_FROM);
    console.log("PASS:", process.env.EMAIL_PASS ? "SET (length=" + process.env.EMAIL_PASS.length + ")" : "NOT SET");
    console.log("=======================\n");

    const port = parseInt(process.env.EMAIL_PORT || "587");
    const secure = port === 465;

    console.log(`Using port ${port}, secure=${secure}`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: port,
        secure: secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        logger: true,
        debug: true
    });

    try {
        console.log("\n--- Step 1: Verifying SMTP connection ---");
        await transporter.verify();
        console.log("SMTP connection verified successfully!\n");

        console.log("--- Step 2: Sending test email ---");
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_FROM,
            subject: "Test Email - Certificate Sender",
            text: "If you see this, your SMTP setup is working correctly!",
            html: "<h1>Test Email</h1><p>If you see this, your SMTP setup is working correctly!</p>"
        });
        console.log("\nEmail sent successfully!");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);
    } catch (error) {
        console.error("\n=== EMAIL FAILED ===");
        console.error("Error name:", error.name);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Full error:", error);
    }
}

testEmail();
