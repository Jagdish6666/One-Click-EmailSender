package com.project.certificates.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateEvent {
    private Long participantId;
    private String name;
    private String email;
    private String eventName;
    private String certificateId;
    private byte[] pdfContent;
}
