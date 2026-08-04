package com.project.certificates.notification.service;

import com.project.certificates.common.CertificateEvent;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Attachments;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Base64;

@Service
@Slf4j
public class EmailService {

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email:}")
    private String fromEmail;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public boolean sendCertificateEmail(CertificateEvent event) {
        log.info("Attempting to send certificate email to: {}", event.getEmail());

        String subject = "Your Certificate for " + event.getEventName();
        String textContent = buildEmailBody(event);

        if (!isKeyValid(sendGridApiKey)) {
            log.warn("SendGrid API key is missing. Falling back to SMTP if available.");
            return sendViaSmtp(event.getEmail(), subject, textContent, event.getPdfContent(), event.getCertificateId());
        }

        if (fromEmail == null || fromEmail.isBlank()) {
            log.error("SendGrid from email is missing. Set SENDGRID_FROM_EMAIL or sendgrid.from.email.");
            return false;
        }

        return sendViaSendGrid(event.getEmail(), subject, textContent, event.getPdfContent(), event.getCertificateId());
    }

    private String buildEmailBody(CertificateEvent event) {
        return "Dear " + event.getName() + ",\n\n"
                + "Congratulations on successfully participating in " + event.getEventName() + ".\n\n"
                + "Your personalized certificate is attached as a PDF.\n\n"
                + "Certificate ID: " + event.getCertificateId() + "\n"
                + "Issued Date: " + LocalDate.now() + "\n\n"
                + "Best regards,\n"
                + "Certificate Team";
    }

    private boolean isKeyValid(String key) {
        return key != null && !key.trim().isEmpty() && !key.equals("your_sendgrid_key") && !key.equals("SG.");
    }

    private boolean sendViaSendGrid(String toEmail, String subject, String textContent, byte[] pdfBytes,
            String certificateId) {
        try {
            Email from = new Email(fromEmail);
            Email to = new Email(toEmail);
            Content content = new Content("text/plain", textContent);
            Mail mail = new Mail(from, subject, to, content);

            if (pdfBytes != null && pdfBytes.length > 0) {
                Attachments attachments = new Attachments();
                attachments.setContent(Base64.getEncoder().encodeToString(pdfBytes));
                attachments.setType("application/pdf");
                attachments.setFilename("certificate-" + certificateId + ".pdf");
                attachments.setDisposition("attachment");
                mail.addAttachments(attachments);
            }

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("SUCCESS: SendGrid email delivered to {}", toEmail);
                return true;
            } else {
                log.error("FAILURE: SendGrid error. Code: {}. Body: {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception ex) {
            log.error("FAILURE: SendGrid exception for {}: {}", toEmail, ex.getMessage());
            log.warn("Attempting SMTP fallback due to SendGrid exception");
            return sendViaSmtp(toEmail, subject, textContent, pdfBytes, certificateId);
        }
    }

    private boolean sendViaSmtp(String toEmail, String subject, String textContent, byte[] pdfBytes,
            String certificateId) {
        if (mailSender == null) {
            log.error("SMTP mailSender not configured. Check spring.mail properties. Cannot send to {}", toEmail);
            return false;
        }

        try {
            log.info("Sending SMTP email to {} using host", toEmail);
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, pdfBytes != null && pdfBytes.length > 0, "UTF-8");

            String sender = (fromEmail == null || fromEmail.isBlank()) ? "noreply@example.com" : fromEmail;
            helper.setFrom(sender);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(textContent, false);

            if (pdfBytes != null && pdfBytes.length > 0) {
                helper.addAttachment("certificate-" + certificateId + ".pdf",
                        new org.springframework.core.io.ByteArrayResource(pdfBytes));
            }

            mailSender.send(message);
            log.info("SUCCESS: SMTP email sent to {}", toEmail);
            return true;
        } catch (Exception ex) {
            log.error("FAILURE: SMTP exception for {}: {}. Cause: {}",
                    toEmail, ex.getMessage(), (ex.getCause() != null ? ex.getCause().getMessage() : "none"));
            return false;
        }
    }
}
