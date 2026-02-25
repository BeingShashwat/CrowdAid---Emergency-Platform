package com.crowdaid.backend.volunteer;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crowdaid.backend.auth.dto.UserDto;
import com.crowdaid.backend.common.ApiResponse;
import com.crowdaid.backend.user.AppUser;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/volunteers")
@RequiredArgsConstructor
@Validated
public class VolunteerController {

    private final VolunteerService volunteerService;

    @GetMapping("/me/stats")
    public ApiResponse<VolunteerStatsDto> stats(@AuthenticationPrincipal AppUser user) {
        return ApiResponse.ok(volunteerService.getStats(user));
    }

    @GetMapping("/me/activity")
    public ApiResponse<List<VolunteerActivityDto>> activity(@AuthenticationPrincipal AppUser user) {
        return ApiResponse.ok(volunteerService.getActivity(user));
    }

    @PatchMapping("/me/status")
    public ApiResponse<Void> setStatus(
        @AuthenticationPrincipal AppUser user,
        @Valid @RequestBody OnlineStatusRequestDto request
    ) {
        volunteerService.setOnline(user, request.isOnline());
        return ApiResponse.ok("Volunteer status updated");
    }

    @GetMapping("/leaderboard")
    public ApiResponse<List<UserDto>> leaderboard() {
        return ApiResponse.ok(volunteerService.leaderboard());
    }
}
