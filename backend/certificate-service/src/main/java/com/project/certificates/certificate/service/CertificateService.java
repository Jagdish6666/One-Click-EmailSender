package com.project.certificates.certificate.service;

import com.project.certificates.common.CertificateEvent;
import com.project.certificates.common.ParticipantResponse;
import com.project.certificates.certificate.config.RabbitMQConfig;
import com.project.certificates.certificate.util.CertificatePdfGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CertificateService {

    private final CertificatePdfGenerator pdfGenerator;
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;

    @Value("${participant.service.url:http://localhost:8083/api/participants}")
    private String participantServiceUrl;

    public void processPendingCertificates() {
        log.info("Starting bulk processing of pending certificates");
        String url = participantServiceUrl + "?status=PENDING";
        try {
            ResponseEntity<List<ParticipantResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ParticipantResponse>>() {}
            );

            List<ParticipantResponse> participants = response.getBody();
            if (participants == null || participants.isEmpty()) {
                log.info("No pending participants found");
                return;
            }
            
            for (ParticipantResponse participant : participants) {
                processSingleParticipant(participant);
            }
        } catch (Exception e) {
            log.error("Failed to fetch pending participants", e);
        }
    }

    public void processSelectedCertificates(List<Long> ids) {
        log.info("Starting processing for selected participants: {}", ids);
        for (Long id : ids) {
            try {
                ResponseEntity<ParticipantResponse> response = restTemplate.getForEntity(
                        participantServiceUrl + "/" + id, ParticipantResponse.class); 
                
                ParticipantResponse p = response.getBody();
                if (p != null) {
                    processSingleParticipant(p);
                }
            } catch (Exception e) {
                log.error("Failed to process selected participant id {}", id, e);
            }
        }
    }

    private void processSingleParticipant(ParticipantResponse participant) {
        try {
            byte[] pdfContent = pdfGenerator.generate(participant);
            
            CertificateEvent event = CertificateEvent.builder()
                    .participantId(participant.getId())
                    .name(participant.getName())
                    .email(participant.getEmail())
                    .eventName(participant.getEventName())
                    .certificateId(participant.getCertificateId())
                    .pdfContent(pdfContent)
                    .build();
            
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, event);
            log.info("Published certificate event for participant id {}", participant.getId());
        } catch (Exception e) {
            log.error("Failed to process single participant id {}", participant.getId(), e);
        }
    }
}
