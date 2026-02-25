package com.crowdaid.backend.config;

import java.time.Duration;
import java.time.Instant;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.crowdaid.backend.emergency.EmergencyGuardService;
import com.crowdaid.backend.otp.OtpSecurityService;
import com.crowdaid.backend.security.IdempotencyService;
import com.crowdaid.backend.security.SessionTokenService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SecurityMaintenanceJob {

    private final OtpSecurityService otpSecurityService;
    private final IdempotencyService idempotencyService;
    private final SessionTokenService sessionTokenService;
    private final EmergencyGuardService emergencyGuardService;

    @Scheduled(fixedDelayString = "PT1H")
    public void cleanupSecurityData() {
        Instant now = Instant.now();
        otpSecurityService.cleanup(now.minus(Duration.ofDays(2)));
        idempotencyService.cleanup(now.minus(Duration.ofDays(1)));
        sessionTokenService.cleanupExpired(now.minus(Duration.ofMinutes(1)));
    }

    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT2M")
    public void runFraudChecks() {
        emergencyGuardService.runFraudPatternScan();
    }
}
