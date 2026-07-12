package com.project.certificates.controller;

import com.project.certificates.dto.ParticipantDto;
import com.project.certificates.entity.Participant;
import com.project.certificates.entity.Status;
import com.project.certificates.service.ParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;

    @PostMapping
    public ResponseEntity<Participant> addParticipant(@Valid @RequestBody ParticipantDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(participantService.addParticipant(dto));
    }

    @GetMapping
    public ResponseEntity<List<Participant>> getParticipants(@RequestParam(required = false) Status status) {
        if (status != null) {
            return ResponseEntity.ok(participantService.getParticipantsByStatus(status));
        }
        return ResponseEntity.ok(participantService.getAllParticipants());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipant(@PathVariable Long id) {
        participantService.deleteParticipant(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/batch")
    public ResponseEntity<Void> deleteParticipants(@RequestBody List<Long> ids) {
        participantService.deleteParticipants(ids);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<com.project.certificates.dto.ApiResponse> uploadExcel(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            int count = participantService.importFromExcel(file);
            return ResponseEntity.ok(new com.project.certificates.dto.ApiResponse(true,
                    "Successfully imported " + count + " participants from Excel."));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new com.project.certificates.dto.ApiResponse(false,
                            "Failed to process Excel file: " + e.getMessage()));
        }
    }
}
