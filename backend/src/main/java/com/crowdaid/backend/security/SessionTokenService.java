package com.crowdaid.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdaid.backend.common.ApiException;
import com.crowdaid.backend.config.JwtService;
import com.crowdaid.backend.user.AppUser;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SessionTokenService {

    private static final Duration DEFAULT_REFRESH_TTL = Duration.ofDays(14);

    private final JwtService jwtService;
    private final UserSessionRepository userSessionRepository;
    private final RevokedAccessTokenRepository revokedAccessTokenRepository;

    @Value("${app.jwt.refresh-expiration-days:14}")
    private long refreshExpirationDays;

    @Transactional
    public TokenPair issueTokens(AppUser user, String ipAddress, String userAgent) {
        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();
        String refreshHash = sha256(refreshToken);
        Instant expiresAt = Instant.now().plus(refreshDuration());

        UserSession session = new UserSession();
        session.setUser(user);
        session.setRefreshTokenHash(refreshHash);
        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgent);
        session.setExpiresAt(expiresAt);
        userSessionRepository.save(session);

        return new TokenPair(jwtService.generateAccessToken(user), refreshToken);
    }

    @Transactional
    public RefreshResult refreshTokens(String refreshToken, String ipAddress, String userAgent) {
        UserSession session = userSessionRepository.findByRefreshTokenHash(sha256(refreshToken))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (session.isRevoked() || session.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }

        session.setRevoked(true);
        session.setRevokedAt(Instant.now());
        userSessionRepository.save(session);

        AppUser user = session.getUser();
        TokenPair pair = issueTokens(user, ipAddress, userAgent);
        return new RefreshResult(user, pair.accessToken(), pair.refreshToken());
    }

    @Transactional
    public void revokeRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        userSessionRepository.revokeByRefreshTokenHash(sha256(refreshToken), Instant.now());
    }

    @Transactional
    public void revokeAllSessions(UUID userId) {
        userSessionRepository.revokeAllByUserId(userId, Instant.now());
    }

    @Transactional
    public void revokeAccessToken(String accessToken, AppUser user) {
        if (accessToken == null || accessToken.isBlank()) {
            return;
        }

        try {
            String jti = jwtService.extractJti(accessToken);
            if (jti == null || jti.isBlank()) {
                return;
            }
            RevokedAccessToken revoked = new RevokedAccessToken();
            revoked.setJti(jti);
            revoked.setUser(user);
            revoked.setExpiresAt(jwtService.extractExpiration(accessToken));
            revokedAccessTokenRepository.save(revoked);
        } catch (Exception ignored) {
            // Token may already be invalid/expired.
        }
    }

    public boolean isAccessTokenRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        return revokedAccessTokenRepository.existsById(jti);
    }

    public List<UserSession> listRecentSessions(UUID userId) {
        return userSessionRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void cleanupExpired(Instant threshold) {
        userSessionRepository.deleteByExpiresAtBefore(threshold);
        revokedAccessTokenRepository.deleteByExpiresAtBefore(threshold);
    }

    private Duration refreshDuration() {
        return refreshExpirationDays <= 0 ? DEFAULT_REFRESH_TTL : Duration.ofDays(refreshExpirationDays);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash token", ex);
        }
    }

    public record TokenPair(String accessToken, String refreshToken) {}

    public record RefreshResult(AppUser user, String accessToken, String refreshToken) {}
}
