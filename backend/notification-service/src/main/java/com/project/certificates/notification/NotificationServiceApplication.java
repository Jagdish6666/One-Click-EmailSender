package com.project.certificates.notification;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication(scanBasePackages = {"com.project.certificates.notification", "com.project.certificates.common"})
public class NotificationServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                String value = entry.getValue();
                if (value != null && !value.isEmpty()) {
                    System.setProperty(entry.getKey(), value);
                }
            });
        } catch (Exception e) {}
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
