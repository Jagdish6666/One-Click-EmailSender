package com.project.certificates.certificate.controller;

import com.project.certificates.common.ApiResponse;
import com.project.certificates.certificate.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.task.TaskExecutor;

import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final TaskExecutor taskExecutor;
    private final AtomicBoolean bulkSendInProgress = new AtomicBoolean(false);

    @PostMapping("/send")
    public ResponseEntity<ApiResponse> sendCertificates() {
        if (!bulkSendInProgress.compareAndSet(false, true)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, "Bulk certificate processing is already running."));
        }

        taskExecutor.execute(() -> {
            try {
                certificateService.processPendingCertificates();
            } finally {
                bulkSendInProgress.set(false);
            }
        });

        return ResponseEntity.ok(new ApiResponse(true, "Bulk certificate processing has been started asynchronously."));
    }

    @PostMapping("/send-selected")
    public ResponseEntity<ApiResponse> sendSelectedCertificates(@RequestBody java.util.List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "No participants selected."));
        }

        if (!bulkSendInProgress.compareAndSet(false, true)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, "Bulk certificate processing is already running."));
        }

        taskExecutor.execute(() -> {
            try {
                certificateService.processSelectedCertificates(ids);
            } finally {
                bulkSendInProgress.set(false);
            }
        });

        return ResponseEntity.ok(new ApiResponse(true, "Processing started for " + ids.size() + " selected participants."));
    }
}
