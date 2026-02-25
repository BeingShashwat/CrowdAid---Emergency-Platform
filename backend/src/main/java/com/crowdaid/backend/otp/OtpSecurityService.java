package com.crowdaid.backend.otp;

import java.time.Duration;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdaid.backend.common.ApiException;
import com.crowdaid.backend.security.RateLimitScope;
import com.crowdaid.backend.security.RateLimitState;
import com.crowdaid.backend.security.RateLimitStateRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OtpSecurityService {

    private static final Duration REQUEST_WINDOW = Duration.ofMinutes(10);
    private static final Duration VERIFY_WINDOW = Duration.ofMinutes(15);
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(30);

    private static final int MAX_REQUESTS_PER_PHONE = 3;
    private static final int MAX_REQUESTS_PER_IP = 10;
    private static final int MAX_VERIFY_FAILURES_PER_PHONE = 5;
    private static final int MAX_VERIFY_FAILURES_PER_IP = 20;

    private final RateLimitStateRepository rateLimitStateRepository;

    @Transactional
    public void checkOtpRequestAllowed(String phone, String ipAddress) {
        incrementRequestCounter(RateLimitScope.OTP_REQUEST_PHONE, phone, MAX_REQUESTS_PER_PHONE, REQUEST_WINDOW);
        incrementRequestCounter(RateLimitScope.OTP_REQUEST_IP, ipAddress, MAX_REQUESTS_PER_IP, REQUEST_WINDOW);
    }

    @Transactional
    public void checkOtpVerifyAllowed(String phone, String ipAddress) {
        checkNotLocked(RateLimitScope.OTP_VERIFY_PHONE, phone);
        checkNotLocked(RateLimitScope.OTP_VERIFY_IP, ipAddress);
    }

    @Transactional
    public void recordOtpVerifyFailure(String phone, String ipAddress) {
        incrementFailureCounter(RateLimitScope.OTP_VERIFY_PHONE, phone, MAX_VERIFY_FAILURES_PER_PHONE, VERIFY_WINDOW);
        incrementFailureCounter(RateLimitScope.OTP_VERIFY_IP, ipAddress, MAX_VERIFY_FAILURES_PER_IP, VERIFY_WINDOW);
    }

    @Transactional
    public void resetOtpVerifyFailures(String phone, String ipAddress) {
        resetFailureCounter(RateLimitScope.OTP_VERIFY_PHONE, phone);
        resetFailureCounter(RateLimitScope.OTP_VERIFY_IP, ipAddress);
    }

    @Transactional
    public void cleanup(Instant threshold) {
        rateLimitStateRepository.deleteByUpdatedAtBefore(threshold);
    }

    private void incrementRequestCounter(RateLimitScope scope, String actorKey, int maxAllowed, Duration window) {
        RateLimitState state = getOrCreate(scope, actorKey);
        Instant now = Instant.now();
        resetWindowIfNeeded(state, now, window);
        ensureNotLocked(state, now);

        if (state.getRequestCount() >= maxAllowed) {
            state.setLockoutUntil(now.plus(LOCKOUT_DURATION));
            rateLimitStateRepository.save(state);
            throw tooManyRequests("Too many OTP requests. Try again after lockout.");
        }

        state.setRequestCount(state.getRequestCount() + 1);
        rateLimitStateRepository.save(state);
    }

    private void incrementFailureCounter(RateLimitScope scope, String actorKey, int maxFailures, Duration window) {
        RateLimitState state = getOrCreate(scope, actorKey);
        Instant now = Instant.now();
        resetWindowIfNeeded(state, now, window);
        ensureNotLocked(state, now);

        int failures = state.getFailureCount() + 1;
        state.setFailureCount(failures);
        if (failures >= maxFailures) {
            state.setLockoutUntil(now.plus(LOCKOUT_DURATION));
        }
        rateLimitStateRepository.save(state);

        if (failures >= maxFailures) {
            throw tooManyRequests("Too many invalid OTP attempts. Try again after lockout.");
        }
    }

    private void resetFailureCounter(RateLimitScope scope, String actorKey) {
        rateLimitStateRepository.findByScopeAndActorKey(scope, actorKey).ifPresent(state -> {
            state.setFailureCount(0);
            state.setLockoutUntil(null);
            rateLimitStateRepository.save(state);
        });
    }

    private void checkNotLocked(RateLimitScope scope, String actorKey) {
        rateLimitStateRepository.findByScopeAndActorKey(scope, actorKey).ifPresent(state -> ensureNotLocked(state, Instant.now()));
    }

    private RateLimitState getOrCreate(RateLimitScope scope, String actorKey) {
        return rateLimitStateRepository.findByScopeAndActorKey(scope, actorKey)
            .orElseGet(() -> {
                RateLimitState state = new RateLimitState();
                state.setScope(scope);
                state.setActorKey(actorKey);
                state.setWindowStartedAt(Instant.now());
                return state;
            });
    }

    private void resetWindowIfNeeded(RateLimitState state, Instant now, Duration window) {
        if (state.getWindowStartedAt() == null || state.getWindowStartedAt().plus(window).isBefore(now)) {
            state.setWindowStartedAt(now);
            state.setRequestCount(0);
            state.setFailureCount(0);
            state.setLockoutUntil(null);
        }
    }

    private void ensureNotLocked(RateLimitState state, Instant now) {
        if (state.getLockoutUntil() != null && state.getLockoutUntil().isAfter(now)) {
            throw tooManyRequests("Request is temporarily locked. Try again later.");
        }
    }

    private ApiException tooManyRequests(String message) {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
    }
}
