package com.project.certificates.certificate.repository;

import com.project.certificates.certificate.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, Long> {
    Optional<CertificateTemplate> findByActive(boolean active);
}
