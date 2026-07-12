package com.project.certificates.controller;

import com.project.certificates.dto.ApiResponse;
import com.project.certificates.service.CertificateService;
import com.project.certificates.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final CertificateService certificateService;
    private final EmailService emailService;

    @PostMapping("/send-test")
    public ResponseEntity<ApiResponse> sendTestEmail(@RequestBody Map<String, String> body) {
        String to = body.get("email");
        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Missing 'email' in request body"));
        }

        byte[] pdf = certificateService.generateCertificatePdf(
                com.project.certificates.entity.Participant.builder()
                        .name("Demo User")
                        .email(to)
                        .eventName("Demo Event")
                        .build()
        );

        boolean sent = emailService.sendCertificateEmail(to, "Demo User", "Demo Event", pdf);
        if (sent) {
            return ResponseEntity.ok(new ApiResponse(true, "Test email sent to " + to));
        }
        return ResponseEntity.status(500).body(new ApiResponse(false, "Failed to send test email. Check server logs for details."));
    }
}
