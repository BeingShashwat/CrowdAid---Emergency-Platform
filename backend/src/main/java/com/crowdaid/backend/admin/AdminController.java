package com.crowdaid.backend.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.crowdaid.backend.common.ApiResponse;
import com.crowdaid.backend.user.AppUser;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ApiResponse<SystemStatsDto> stats(@AuthenticationPrincipal AppUser actor) {
        return ApiResponse.ok(adminService.getStats(actor));
    }
}
