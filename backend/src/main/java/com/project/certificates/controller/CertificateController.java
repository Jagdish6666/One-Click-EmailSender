package com.project.certificates.controller;

import com.project.certificates.dto.ApiResponse;
import com.project.certificates.service.BulkCertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final BulkCertificateService bulkCertificateService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse> sendCertificates() {
        boolean started = bulkCertificateService.startPendingCertificateProcessing();
        if (!started) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, "Bulk certificate processing is already running."));
        }

        return ResponseEntity.ok(new ApiResponse(true, "Bulk certificate processing has been started asynchronously."));
    }

    @PostMapping("/send-selected")
    public ResponseEntity<ApiResponse> sendSelectedCertificates(@RequestBody java.util.List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "No participants selected."));
        }

        boolean started = bulkCertificateService.startSelectedCertificateProcessing(ids);
        if (!started) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, "Bulk certificate processing is already running."));
        }

        return ResponseEntity
                .ok(new ApiResponse(true, "Processing started for " + ids.size() + " selected participants."));
    }
}
