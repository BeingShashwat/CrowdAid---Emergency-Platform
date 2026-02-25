package com.crowdaid.backend.volunteer;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdaid.backend.auth.AuthService;
import com.crowdaid.backend.auth.dto.UserDto;
import com.crowdaid.backend.common.ApiException;
import com.crowdaid.backend.emergency.Emergency;
import com.crowdaid.backend.emergency.EmergencyRepository;
import com.crowdaid.backend.emergency.EmergencyStatus;
import com.crowdaid.backend.user.AppUser;
import com.crowdaid.backend.user.UserRepository;
import com.crowdaid.backend.user.UserRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VolunteerService {

    private final EmergencyRepository emergencyRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public VolunteerStatsDto getStats(AppUser volunteer) {
        ensureVolunteer(volunteer);

        long totalResponses = emergencyRepository.countByRespondingVolunteerId(volunteer.getId());
        long completed = emergencyRepository.countByRespondingVolunteerIdAndStatus(volunteer.getId(), EmergencyStatus.RESOLVED);
        int completionRate = totalResponses == 0 ? 0 : (int) Math.round((completed * 100.0) / totalResponses);

        List<Emergency> history = emergencyRepository.findTop100ByRespondingVolunteerIdOrderByCreatedAtDesc(volunteer.getId());
        double avgResponseMin = history.stream()
            .map(Emergency::getResponseTimeMin)
            .filter(value -> value != null)
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
        Double avgThanksRaw = emergencyRepository.findAverageThankPointsByVolunteerId(volunteer.getId());
        double avgThankPoints = avgThanksRaw == null ? 0.0 : avgThanksRaw;

        BadgeProgress badge = badgeFor((int) completed);

        return new VolunteerStatsDto(
            (int) completed,
            Math.round(avgThankPoints * 100.0) / 100.0,
            avgResponseMin == 0.0 ? "N/A" : String.format("%.1f min", avgResponseMin),
            completionRate,
            badge.progress(),
            badge.current(),
            badge.next()
        );
    }

    public List<VolunteerActivityDto> getActivity(AppUser volunteer) {
        ensureVolunteer(volunteer);
        return emergencyRepository.findTop100ByRespondingVolunteerIdOrderByCreatedAtDesc(volunteer.getId()).stream()
            .map(item -> new VolunteerActivityDto(
                item.getId().toString(),
                item.getType().name().replace('_', ' '),
                item.getAddress(),
                item.getStatus().name(),
                item.getThankPoints() == null ? 0 : item.getThankPoints(),
                item.getDescription(),
                item.getResponseTimeMin() == null ? "N/A" : String.format("%.1f min", item.getResponseTimeMin()),
                item.getCreatedAt()
            ))
            .toList();
    }

    @Transactional
    public void setOnline(AppUser volunteer, boolean isOnline) {
        ensureVolunteer(volunteer);
        volunteer.setOnline(isOnline);
        userRepository.save(volunteer);
    }

    public List<UserDto> leaderboard() {
        return userRepository.findByRoleOrIsVolunteerTrue(UserRole.VOLUNTEER).stream()
            .sorted(Comparator.comparingInt(AppUser::getTotalHelped).reversed())
            .limit(20)
            .map(authService::toUserDto)
            .toList();
    }

    private void ensureVolunteer(AppUser user) {
        if (user.getRole() == UserRole.ADMIN) {
            return;
        }
        if (user.getRole() != UserRole.VOLUNTEER && !user.isVolunteer()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Volunteer access required");
        }
    }

    private BadgeProgress badgeFor(int completed) {
        if (completed >= 200) {
            return new BadgeProgress("Gold", "Elite", 100);
        }
        if (completed >= 75) {
            int progress = (int) Math.min(100, Math.round(((completed - 75) / 125.0) * 100));
            return new BadgeProgress("Silver", "Gold", progress);
        }
        int progress = (int) Math.min(100, Math.round((completed / 75.0) * 100));
        return new BadgeProgress("Bronze", "Silver", progress);
    }

    private record BadgeProgress(String current, String next, int progress) {}
}
