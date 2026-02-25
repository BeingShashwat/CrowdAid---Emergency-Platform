package com.crowdaid.backend.admin;

public record SystemStatsDto(
    long activeEmergencies,
    long totalVolunteers,
    long onlineVolunteers,
    int responseRate,
    String avgResponseTime,
    long resolvedToday,
    long totalUsers
) {
}
