package com.crowdaid.backend.emergency;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crowdaid.backend.common.ApiResponse;
import com.crowdaid.backend.common.PagedResponse;
import com.crowdaid.backend.security.RequestMetadataResolver;
import com.crowdaid.backend.user.AppUser;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/emergencies")
@RequiredArgsConstructor
@Validated
public class EmergencyController {

    private final EmergencyService emergencyService;

    @PostMapping("/sos")
    public ApiResponse<EmergencyDto> sendSos(
        @Valid @RequestBody SosRequestDto request,
        Authentication authentication,
        HttpServletRequest servletRequest,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        AppUser requester = extractUser(authentication);
        String ip = RequestMetadataResolver.clientIp(servletRequest);
        return ApiResponse.ok("SOS sent", emergencyService.sendSos(request, requester, ip, idempotencyKey));
    }

    @GetMapping("/nearby")
    public ApiResponse<List<EmergencyDto>> getNearby(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam(defaultValue = "5") double radiusKm
    ) {
        return ApiResponse.ok(emergencyService.getNearby(lat, lng, radiusKm));
    }

    @GetMapping
    public ApiResponse<PagedResponse<EmergencyDto>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String status
    ) {
        return ApiResponse.ok(emergencyService.getAll(page, size, status));
    }

    @GetMapping("/my")
    public ApiResponse<List<EmergencyDto>> myEmergencies(
        @AuthenticationPrincipal AppUser requester,
        @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return ApiResponse.ok(emergencyService.getMyEmergencies(requester, activeOnly));
    }

    @PostMapping("/{id}/respond")
    public ApiResponse<RespondEmergencyResultDto> respond(
        @PathVariable UUID id,
        @AuthenticationPrincipal AppUser volunteer,
        @Valid @RequestBody RespondEmergencyRequestDto request,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        return ApiResponse.ok("Response accepted", emergencyService.respond(id, volunteer, idempotencyKey));
    }

    @PostMapping("/{id}/resolve")
    public ApiResponse<Void> resolve(@PathVariable UUID id, @AuthenticationPrincipal AppUser actor) {
        emergencyService.resolve(id, actor);
        return ApiResponse.ok("Emergency resolved");
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable UUID id, @AuthenticationPrincipal AppUser actor) {
        emergencyService.cancel(id, actor);
        return ApiResponse.ok("Emergency cancelled");
    }

    @PostMapping("/{id}/thank")
    public ApiResponse<EmergencyDto> thankVolunteer(
        @PathVariable UUID id,
        @AuthenticationPrincipal AppUser requester,
        @Valid @RequestBody ThankVolunteerRequestDto request
    ) {
        return ApiResponse.ok("Thank points submitted", emergencyService.thankVolunteer(id, requester, request.points()));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv() {
        byte[] csv = emergencyService.exportCsv();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"crowdaid-emergencies.csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv);
    }

    private AppUser extractUser(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUser appUser) {
            return appUser;
        }
        return null;
    }
}
