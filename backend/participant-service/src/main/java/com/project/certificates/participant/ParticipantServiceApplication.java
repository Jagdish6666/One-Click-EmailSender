package com.project.certificates.participant;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication(scanBasePackages = {"com.project.certificates.participant", "com.project.certificates.common"})
@EntityScan(basePackages = {"com.project.certificates.participant.entity", "com.project.certificates.common"})
public class ParticipantServiceApplication {

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
        } catch (Exception e) {
            // Fallback to normal Spring environment resolution
        }

        SpringApplication.run(ParticipantServiceApplication.class, args);
    }
}
