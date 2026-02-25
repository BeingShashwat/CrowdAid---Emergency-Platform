package com.crowdaid.backend.volunteer;

import java.time.Instant;

public record VolunteerActivityDto(
    String id,
    String type,
    String location,
    String status,
    int rating,
    String description,
    String responseTime,
    Instant createdAt
) {
}
