package com.crowdaid.backend.emergency;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdaid.backend.audit.AuditService;
import com.crowdaid.backend.common.ApiException;
import com.crowdaid.backend.security.RateLimitScope;
import com.crowdaid.backend.security.RateLimitState;
import com.crowdaid.backend.security.RateLimitStateRepository;
import com.crowdaid.backend.user.AppUser;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmergencyGuardService {

    private static final Duration SOS_WINDOW = Duration.ofMinutes(10);
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(20);
    private static final int MAX_SOS_PER_USER_WINDOW = 3;
    private static final int MAX_SOS_PER_IP_WINDOW = 6;

    private final EmergencyRepository emergencyRepository;
    private final RateLimitStateRepository rateLimitStateRepository;
    private final AuditService auditService;

    @Transactional
    public void assertCanCreateSos(AppUser requester, String requesterIp) {
        if (requester != null) {
            boolean hasActive = emergencyRepository.existsByUserIdAndStatusIn(
                requester.getId(),
                List.of(EmergencyStatus.PENDING, EmergencyStatus.IN_PROGRESS)
            );
            if (hasActive) {
                throw new ApiException(HttpStatus.CONFLICT, "You already have an active SOS request");
            }
            incrementRequestCounter(RateLimitScope.SOS_USER, requester.getId().toString(), MAX_SOS_PER_USER_WINDOW);
        }

        incrementRequestCounter(RateLimitScope.SOS_IP, requesterIp, MAX_SOS_PER_IP_WINDOW);
    }

    @Transactional
    public void runFraudPatternScan() {
        Instant since = Instant.now().minus(Duration.ofHours(24));
        emergencyRepository.findFrequentPhonesSince(since, 8).forEach(row -> {
            String phone = String.valueOf(row[0]);
            String count = String.valueOf(row[1]);
            auditService.log(null, "FRAUD_PATTERN_DETECTED", "EMERGENCY", phone, "Repeated SOS phone in 24h: " + count);
        });

        emergencyRepository.findFrequentIpsSince(since, 12).forEach(row -> {
            String ip = String.valueOf(row[0]);
            String count = String.valueOf(row[1]);
            auditService.log(null, "FRAUD_PATTERN_DETECTED", "EMERGENCY", ip, "Repeated SOS IP in 24h: " + count);
        });
    }

    private void incrementRequestCounter(RateLimitScope scope, String actorKey, int maxAllowed) {
        if (actorKey == null || actorKey.isBlank()) {
            return;
        }

        RateLimitState state = rateLimitStateRepository.findByScopeAndActorKey(scope, actorKey)
            .orElseGet(() -> {
                RateLimitState created = new RateLimitState();
                created.setScope(scope);
                created.setActorKey(actorKey);
                created.setWindowStartedAt(Instant.now());
                return created;
            });

        Instant now = Instant.now();
        if (state.getWindowStartedAt() == null || state.getWindowStartedAt().plus(SOS_WINDOW).isBefore(now)) {
            state.setWindowStartedAt(now);
            state.setRequestCount(0);
            state.setFailureCount(0);
            state.setLockoutUntil(null);
        }

        if (state.getLockoutUntil() != null && state.getLockoutUntil().isAfter(now)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "SOS requests are temporarily locked. Try again later.");
        }

        if (state.getRequestCount() >= maxAllowed) {
            state.setLockoutUntil(now.plus(LOCKOUT_DURATION));
            rateLimitStateRepository.save(state);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many SOS requests. Please wait before sending again.");
        }

        state.setRequestCount(state.getRequestCount() + 1);
        rateLimitStateRepository.save(state);
    }
}
