package com.project.certificates.gateway;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {

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
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
