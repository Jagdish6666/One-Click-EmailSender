package com.project.certificates.common;

import lombok.Data;

@Data
public class ParticipantResponse {
    private Long id;
    private String name;
    private String email;
    private String eventName;
    private String certificateId;
    private Status status;
}
