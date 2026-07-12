package com.project.certificates.controller;

import com.project.certificates.dto.ApiResponse;
import com.project.certificates.entity.CertificateTemplate;
import com.project.certificates.repository.CertificateTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final CertificateTemplateRepository repository;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse> uploadTemplate(@RequestParam("file") MultipartFile file) {
        try {
            // Deactivate old active templates
            repository.findAll().forEach(t -> {
                t.setActive(false);
                repository.save(t);
            });

            CertificateTemplate template = CertificateTemplate.builder()
                    .name(file.getOriginalFilename())
                    .content(file.getBytes())
                    .active(true)
                    .build();

            repository.save(template);
            return ResponseEntity
                    .ok(new ApiResponse(true, "Certificate template uploaded and activated successfully."));
        } catch (IOException e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(false, "Failed to upload template: " + e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveTemplate() {
        return repository.findByActive(true)
                .map(t -> ResponseEntity.ok(t))
                .orElse(ResponseEntity.ok(null));
    }

    @PatchMapping("/alignment")
    public ResponseEntity<ApiResponse> updateAlignment(@RequestBody CertificateTemplate alignment) {
        return repository.findByActive(true)
                .map(t -> {
                    if (alignment.getNameY() != null)
                        t.setNameY(alignment.getNameY());
                    if (alignment.getEventY() != null)
                        t.setEventY(alignment.getEventY());
                    if (alignment.getFontSize() != null)
                        t.setFontSize(alignment.getFontSize());
                    repository.save(t);
                    return ResponseEntity.ok(new ApiResponse(true, "Alignment calibrated successfully."));
                }).orElse(ResponseEntity.notFound().build());
    }
}
