package com.project.certificates.participant.controller;

import com.project.certificates.common.ParticipantDto;
import com.project.certificates.common.ApiResponse;
import com.project.certificates.participant.entity.Participant;
import com.project.certificates.common.Status;
import com.project.certificates.participant.service.ParticipantService;
import com.project.certificates.common.ResourceNotFoundException;
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

    @GetMapping("/{id}")
    public ResponseEntity<Participant> getParticipantById(@PathVariable Long id) {
        return participantService.getParticipantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
    public ResponseEntity<ApiResponse> uploadExcel(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            int count = participantService.importFromExcel(file);
            return ResponseEntity.ok(new ApiResponse(true,
                    "Successfully imported " + count + " participants from Excel."));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false,
                            "Failed to process Excel file: " + e.getMessage()));
        }
    }
    
    // Internal endpoint for notification-service to update status
    @PutMapping("/{id}/status")
    public ResponseEntity<Participant> updateStatus(@PathVariable Long id, @RequestParam Status status) {
        Participant participant = participantService.getParticipantById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));
        return ResponseEntity.ok(participantService.updateStatus(participant, status));
    }
}
