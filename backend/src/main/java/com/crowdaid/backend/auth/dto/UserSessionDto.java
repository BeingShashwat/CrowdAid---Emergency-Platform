package com.crowdaid.backend.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record UserSessionDto(
    UUID id,
    String ipAddress,
    String userAgent,
    Instant createdAt,
    Instant expiresAt,
    boolean revoked
) {
}
