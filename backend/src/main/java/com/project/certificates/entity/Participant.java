package com.project.certificates.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String eventName;

    @Column(nullable = false, unique = true)
    @Builder.Default
    private String certificateId = java.util.UUID.randomUUID().toString();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (certificateId == null || certificateId.isBlank()) {
            certificateId = UUID.randomUUID().toString();
        }
        if (status == null) {
            status = Status.PENDING;
        }
    }
}
