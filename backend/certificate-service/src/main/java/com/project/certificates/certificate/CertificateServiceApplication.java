package com.project.certificates.certificate;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication(scanBasePackages = {"com.project.certificates.certificate", "com.project.certificates.common"})
@EntityScan(basePackages = {"com.project.certificates.certificate.entity", "com.project.certificates.common"})
public class CertificateServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                String value = entry.getValue();
                if (value != null && !value.isEmpty()) {
                    if (entry.getKey().equals("DATABASE_URL") && value.startsWith("mysql://")) {
                        value = "jdbc:" + value;
                    }
                    System.setProperty(entry.getKey(), value);
                }
            });
        } catch (Exception e) {}
        SpringApplication.run(CertificateServiceApplication.class, args);
    }
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
