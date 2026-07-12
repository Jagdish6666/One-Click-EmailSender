package com.project.certificates.service;

import com.project.certificates.entity.Participant;
import com.project.certificates.entity.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
@RequiredArgsConstructor
public class BulkCertificateService {

    private final ParticipantService participantService;
    private final CertificateService certificateService;
    private final EmailService emailService;
    private final TaskExecutor taskExecutor;
    private final AtomicBoolean bulkSendInProgress = new AtomicBoolean(false);

    public boolean startPendingCertificateProcessing() {
        if (!bulkSendInProgress.compareAndSet(false, true)) {
            log.warn("Bulk certificate send is already running. Duplicate request ignored.");
            return false;
        }

        taskExecutor.execute(() -> {
            try {
                processAndSendCertificates();
            } finally {
                bulkSendInProgress.set(false);
            }
        });
        return true;
    }

    public boolean startSelectedCertificateProcessing(List<Long> ids) {
        if (!bulkSendInProgress.compareAndSet(false, true)) {
            log.warn("Bulk certificate send is already running. Duplicate request ignored.");
            return false;
        }

        taskExecutor.execute(() -> {
            try {
                processSelectedParticipants(ids);
            } finally {
                bulkSendInProgress.set(false);
            }
        });
        return true;
    }

    public boolean isBulkSendInProgress() {
        return bulkSendInProgress.get();
    }

    private void processSelectedParticipants(List<Long> ids) {
        log.info("Starting certificate processing for {} selected participants", ids.size());
        for (Long id : ids) {
            participantService.getParticipantById(id).ifPresent(this::processSingleParticipant);
        }
        log.info("Completed processing for selected participants");
    }

    public void processAndSendCertificates() {
        log.info("Starting bulk certificate processing for pending participants");
        List<Participant> pendingParticipants = participantService.fetchPendingParticipants();
        if (pendingParticipants.isEmpty()) {
            log.info("No pending participants found");
            return;
        }

        for (Participant participant : pendingParticipants) {
            processSingleParticipant(participant);
        }

        log.info("Completed bulk certificate processing for {} pending participants", pendingParticipants.size());
    }

    private void processSingleParticipant(Participant participant) {
        Status finalStatus = Status.FAILED;
        try {
            byte[] pdf = certificateService.generateCertificatePdf(participant);
            boolean sent = emailService.sendCertificateEmail(participant, pdf);
            finalStatus = sent ? Status.SENT : Status.FAILED;
        } catch (Exception ex) {
            log.error("Failed to process certificate for participant id={} email={}",
                    participant.getId(), participant.getEmail(), ex);
        }

        try {
            participantService.updateStatus(participant, finalStatus);
        } catch (Exception ex) {
            log.error("Failed to update status={} for participant id={}",
                    finalStatus, participant.getId(), ex);
        }
    }
}
