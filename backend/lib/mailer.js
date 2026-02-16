/**
 * @file mailer.js
 * @description Generic SMTP Email service using Nodemailer.
 */

const nodemailer = require("nodemailer");

/**
 * Creates a transporter using SMTP settings from environment variables.
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Sends an email with an optional PDF attachment.
 * @param {Object} opts - Email options.
 * @param {string} opts.to - Recipient email.
 * @param {string} opts.subject - Email subject.
 * @param {string} opts.text - Plain text body.
 * @param {string} [opts.html] - HTML body.
 * @param {Object} [opts.attachment] - Attachment details.
 * @param {string} opts.attachment.content - Base64 encoded string.
 * @param {string} opts.attachment.filename - Filename.
 */
async function sendEmail(opts) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html || opts.text,
    };

    if (opts.attachment) {
        mailOptions.attachments = [
            {
                filename: opts.attachment.filename,
                content: opts.attachment.content,
                encoding: "base64",
            },
        ];
    }

    return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
