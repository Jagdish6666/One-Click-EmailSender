package com.project.certificates.repository;

import com.project.certificates.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, Long> {
    Optional<CertificateTemplate> findByActive(boolean active);
}
