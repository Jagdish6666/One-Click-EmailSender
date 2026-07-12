package com.project.certificates;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CertificateSenderApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                String value = entry.getValue();
                if (value != null && !value.isEmpty()) {
                    // Fix Database URL if it's missing the jdbc: prefix from the user provided
                    // format
                    if (entry.getKey().equals("DATABASE_URL") && value.startsWith("mysql://")) {
                        value = "jdbc:" + value;
                    }
                    System.setProperty(entry.getKey(), value);
                }
            });
        } catch (Exception e) {
            // Fallback to normal Spring environment resolution
        }

        SpringApplication.run(CertificateSenderApplication.class, args);
    }
}
