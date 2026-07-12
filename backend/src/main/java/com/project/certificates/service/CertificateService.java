package com.project.certificates.service;

import com.project.certificates.entity.Participant;
import com.project.certificates.util.CertificatePdfGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificatePdfGenerator certificatePdfGenerator;

    public byte[] generateCertificatePdf(Participant participant) {
        return certificatePdfGenerator.generate(participant);
    }
}
