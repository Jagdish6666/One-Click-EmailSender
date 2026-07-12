package com.project.certificates.service;

import com.project.certificates.dto.ParticipantDto;
import com.project.certificates.entity.Participant;
import com.project.certificates.entity.Status;
import com.project.certificates.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipantService {
    private final ParticipantRepository repository;

    public java.util.Optional<Participant> getParticipantById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Participant addParticipant(ParticipantDto dto) {
        Participant participant = new Participant();
        participant.setName(dto.getName() != null ? dto.getName().trim() : null);
        participant.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        String event = dto.getEventName() != null ? dto.getEventName().trim() : "";
        participant.setEventName(event.isBlank() ? "Unknown Event" : event);
        return repository.save(participant);
    }

    public List<Participant> getAllParticipants() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public List<Participant> getParticipantsByStatus(Status status) {
        return repository.findByStatus(status);
    }

    public List<Participant> fetchPendingParticipants() {
        return repository.findByStatusInOrderByCreatedAtDesc(java.util.List.of(Status.PENDING, Status.FAILED));
    }

    @Transactional
    public Participant updateStatus(Participant participant, Status status) {
        participant.setStatus(status);
        return repository.saveAndFlush(participant);
    }

    @Transactional
    public int importFromExcel(org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        int count = 0;
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null)
                return 0;

            int nameCol = -1, emailCol = -1, eventCol = -1;
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                String header = getCellValue(headerRow.getCell(i));
                if (header == null)
                    continue;
                header = header.toLowerCase().trim();
                if (header.contains("name") && !header.contains("event"))
                    nameCol = i;
                if (header.contains("email") || header.contains("mail"))
                    emailCol = i;
                if (header.contains("event") || header.contains("ref"))
                    eventCol = i;
            }

            // Fallback to 0, 1, 2 if headers not found
            if (nameCol == -1)
                nameCol = 0;
            if (emailCol == -1)
                emailCol = 1;
            if (eventCol == -1)
                eventCol = 2;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                String name = getCellValue(row.getCell(nameCol));
                String email = getCellValue(row.getCell(emailCol));
                String eventName = getCellValue(row.getCell(eventCol));

                if (name != null && email != null && !name.isBlank() && !email.isBlank()) {
                    // Check length and truncate if somehow still too big (unlikely with TEXT)
                    Participant participant = new Participant();
                    participant.setName(name.length() > 250 ? name.substring(0, 250).trim() : name.trim());
                    participant.setEmail(email.length() > 250 ? email.substring(0, 250).trim() : email.trim());
                    String event = eventName != null ? eventName.trim() : "";
                    if (event.isBlank())
                        event = "Unknown Event";
                    participant.setEventName(event.length() > 250 ? event.substring(0, 250).trim() : event.trim());

                    repository.save(participant);
                    count++;
                }
            }
        }
        return count;
    }

    private String getCellValue(org.apache.poi.ss.usermodel.Cell cell) {
        if (cell == null)
            return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return null;
        }
    }

    @Transactional
    public void deleteParticipants(List<Long> ids) {
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ParticipantService.class);
        log.info("Attempting to bulk delete {} participants", ids.size());
        repository.deleteAllByIdInBatch(ids);
        log.info("Bulk deletion successful");
    }

    @Transactional
    public void deleteParticipant(Long id) {
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ParticipantService.class);
        log.info("Attempting to delete participant with ID: {}", id);
        if (repository.existsById(id)) {
            repository.deleteById(id);
            log.info("Participant with ID: {} deleted successfully", id);
        } else {
            log.warn("Participant with ID: {} not found for deletion", id);
        }
    }
}
