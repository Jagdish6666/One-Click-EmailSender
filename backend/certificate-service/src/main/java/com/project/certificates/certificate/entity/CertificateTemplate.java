package com.project.certificates.certificate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "certificate_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] content;

    private boolean active;

    @Builder.Default
    private Integer nameY = 0; // Offset from center

    @Builder.Default
    private Integer eventY = -50; // Offset from center

    @Builder.Default
    private Integer fontSize = 42;
}
