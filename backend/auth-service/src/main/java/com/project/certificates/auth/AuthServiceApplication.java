package com.project.certificates.auth;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.project.certificates.auth", "com.project.certificates.common"})
public class AuthServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                String value = entry.getValue();
                if (value != null && !value.isEmpty()) {
                    System.setProperty(entry.getKey(), value);
                }
            });
        } catch (Exception e) {
            // Fallback to normal Spring environment resolution
        }

        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
