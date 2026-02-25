package com.crowdaid.backend.auth.dto;

import java.time.Instant;
import java.util.UUID;

import com.crowdaid.backend.user.UserRole;

public record UserDto(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String phone,
    UserRole role,
    boolean isVolunteer,
    boolean isVerified,
    Double volunteerRating,
    Integer thankPointsTotal,
    Integer totalHelped,
    Double completionRate,
    String avgResponseTime,
    Boolean isOnline,
    Instant createdAt
) {
}
