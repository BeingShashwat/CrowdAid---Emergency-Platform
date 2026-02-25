package com.crowdaid.backend.volunteer;

public record VolunteerStatsDto(
    int totalHelped,
    double rating,
    String responseTime,
    int completionRate,
    int badgeProgress,
    String currentBadge,
    String nextBadge
) {
}
