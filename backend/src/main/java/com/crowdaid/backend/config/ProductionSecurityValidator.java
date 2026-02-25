package com.crowdaid.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProductionSecurityValidator implements ApplicationRunner {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.bootstrap.admin.password}")
    private String adminPassword;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void run(ApplicationArguments args) {
        if (jwtSecret == null || jwtSecret.length() < 32 || jwtSecret.contains("change-me")) {
            throw new IllegalStateException("Invalid JWT secret for production");
        }

        if (adminPassword == null || adminPassword.length() < 12 || adminPassword.contains("change-this")) {
            throw new IllegalStateException("Invalid ADMIN_PASSWORD for production");
        }

        if (allowedOrigins == null || allowedOrigins.isBlank() || allowedOrigins.contains("localhost")) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS must be set to public frontend domains in production");
        }
    }
}
