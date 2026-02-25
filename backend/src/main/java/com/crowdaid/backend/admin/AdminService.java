package com.crowdaid.backend.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.stereotype.Service;

import com.crowdaid.backend.audit.AuditService;
import com.crowdaid.backend.emergency.Emergency;
import com.crowdaid.backend.emergency.EmergencyRepository;
import com.crowdaid.backend.emergency.EmergencyStatus;
import com.crowdaid.backend.user.AppUser;
import com.crowdaid.backend.user.UserRepository;
import com.crowdaid.backend.user.UserRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final EmergencyRepository emergencyRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SystemStatsDto getStats(AppUser actor) {
        long activeEmergencies = emergencyRepository.countByStatusIn(List.of(EmergencyStatus.PENDING, EmergencyStatus.IN_PROGRESS));
        long totalVolunteers = userRepository.countVolunteers(UserRole.VOLUNTEER);
        long onlineVolunteers = userRepository.countOnlineVolunteers(UserRole.VOLUNTEER);

        long totalEmergencies = emergencyRepository.count();
        long resolved = emergencyRepository.countByStatus(EmergencyStatus.RESOLVED);
        int responseRate = totalEmergencies == 0 ? 0 : (int) Math.round((resolved * 100.0) / totalEmergencies);

        String avgResponse = averageResponseTime();

        Instant startOfDayUtc = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        long resolvedToday = emergencyRepository.countByStatusAndUpdatedAtAfter(EmergencyStatus.RESOLVED, startOfDayUtc);

        long totalUsers = userRepository.count();

        if (actor != null) {
            auditService.log(actor.getId(), "ADMIN_VIEW_STATS", "ADMIN_DASHBOARD", null, "Admin fetched system stats");
        }

        return new SystemStatsDto(
            activeEmergencies,
            totalVolunteers,
            onlineVolunteers,
            responseRate,
            avgResponse,
            resolvedToday,
            totalUsers
        );
    }

    private String averageResponseTime() {
        List<Emergency> all = emergencyRepository.findAll();
        double avg = all.stream()
            .map(Emergency::getResponseTimeMin)
            .filter(value -> value != null)
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
        return avg == 0.0 ? "N/A" : String.format("%.1f min", avg);
    }
}
