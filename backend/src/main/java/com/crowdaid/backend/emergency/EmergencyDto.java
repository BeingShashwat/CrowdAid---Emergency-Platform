package com.crowdaid.backend.emergency;

import java.time.Instant;
import java.util.UUID;

public record EmergencyDto(
    UUID id,
    String userId,
    String userName,
    String userPhone,
    EmergencyType type,
    EmergencyStatus status,
    EmergencySeverity severity,
    String description,
    LocationDto location,
    Double distanceKm,
    int volunteers,
    Double responseTimeMin,
    String requesterPhone,
    String volunteerPhone,
    Integer thankPoints,
    Instant createdAt,
    Instant updatedAt
) {
}
