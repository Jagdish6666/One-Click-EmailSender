package com.project.certificates.notification.consumer;

import com.project.certificates.common.CertificateEvent;
import com.project.certificates.common.Status;
import com.project.certificates.notification.service.EmailService;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

@Service
@Slf4j
@RequiredArgsConstructor
public class CertificateConsumer {

    private final EmailService emailService;
    private final RestTemplate restTemplate;
    
    @Value("${participant.service.url:http://localhost:8083/api/participants}")
    private String participantServiceUrl;

    @RabbitListener(queues = "certificate.send.queue", ackMode = "MANUAL")
    public void consumeMessage(CertificateEvent event, Channel channel, Message message) throws IOException {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            boolean sent = emailService.sendCertificateEmail(event);
            Status finalStatus = sent ? Status.SENT : Status.FAILED;
            
            updateParticipantStatus(event.getParticipantId(), finalStatus);
            
            if (sent) {
                channel.basicAck(deliveryTag, false);
            } else {
                channel.basicNack(deliveryTag, false, false);
            }
        } catch (Exception e) {
            log.error("Error processing certificate event for participant {}", event.getParticipantId(), e);
            channel.basicNack(deliveryTag, false, false);
        }
    }

    private void updateParticipantStatus(Long participantId, Status status) {
        String url = participantServiceUrl + "/" + participantId + "/status?status=" + status;
        try {
            restTemplate.exchange(url, HttpMethod.PUT, HttpEntity.EMPTY, Void.class);
            log.info("Successfully updated status to {} for participant {}", status, participantId);
        } catch (Exception e) {
            log.error("Failed to update status for participant {}", participantId, e);
            throw new RuntimeException("Could not update status", e);
        }
    }
}
