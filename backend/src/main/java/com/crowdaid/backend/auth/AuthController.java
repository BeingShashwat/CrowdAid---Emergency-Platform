package com.crowdaid.backend.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.crowdaid.backend.auth.dto.AuthResponseDto;
import com.crowdaid.backend.auth.dto.DeleteAccountRequestDto;
import com.crowdaid.backend.auth.dto.LoginRequestDto;
import com.crowdaid.backend.auth.dto.LogoutRequestDto;
import com.crowdaid.backend.auth.dto.RefreshTokenRequestDto;
import com.crowdaid.backend.auth.dto.RegisterRequestDto;
import com.crowdaid.backend.auth.dto.RequestOtpDto;
import com.crowdaid.backend.auth.dto.UserDto;
import com.crowdaid.backend.auth.dto.UserSessionDto;
import com.crowdaid.backend.auth.dto.VerifyOtpDto;
import com.crowdaid.backend.common.ApiResponse;
import com.crowdaid.backend.security.RequestMetadataResolver;
import com.crowdaid.backend.user.AppUser;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request, HttpServletRequest servletRequest) {
        return ApiResponse.ok(
            "Login successful",
            authService.login(
                request,
                RequestMetadataResolver.clientIp(servletRequest),
                RequestMetadataResolver.userAgent(servletRequest)
            )
        );
    }

    @PostMapping("/register/request-otp")
    public ApiResponse<Void> requestOtp(@Valid @RequestBody RequestOtpDto request, HttpServletRequest servletRequest) {
        authService.requestSignupOtp(request, RequestMetadataResolver.clientIp(servletRequest));
        return ApiResponse.ok("OTP sent to phone number");
    }

    @PostMapping("/register/verify-otp")
    public ApiResponse<Void> verifyOtp(@Valid @RequestBody VerifyOtpDto request, HttpServletRequest servletRequest) {
        authService.verifySignupOtp(request, RequestMetadataResolver.clientIp(servletRequest));
        return ApiResponse.ok("OTP verified");
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request, HttpServletRequest servletRequest) {
        return ApiResponse.ok(
            "Registration successful",
            authService.register(
                request,
                RequestMetadataResolver.clientIp(servletRequest),
                RequestMetadataResolver.userAgent(servletRequest)
            )
        );
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponseDto> refresh(
        @Valid @RequestBody RefreshTokenRequestDto request,
        HttpServletRequest servletRequest
    ) {
        return ApiResponse.ok(
            "Token refreshed",
            authService.refresh(
                request,
                RequestMetadataResolver.clientIp(servletRequest),
                RequestMetadataResolver.userAgent(servletRequest)
            )
        );
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
        @RequestBody(required = false) LogoutRequestDto request,
        @AuthenticationPrincipal AppUser user,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        authService.logout(user, extractBearerToken(authorizationHeader), request);
        return ApiResponse.ok("Logged out");
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me(@AuthenticationPrincipal AppUser user) {
        return ApiResponse.ok(authService.me(user));
    }

    @PostMapping("/logout-all")
    public ApiResponse<Void> logoutAll(
        @AuthenticationPrincipal AppUser user,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        authService.logoutAll(user, extractBearerToken(authorizationHeader));
        return ApiResponse.ok("Logged out from all devices");
    }

    @GetMapping("/sessions")
    public ApiResponse<List<UserSessionDto>> sessions(@AuthenticationPrincipal AppUser user) {
        return ApiResponse.ok(authService.sessions(user));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> deleteAccount(
        @AuthenticationPrincipal AppUser user,
        @Valid @RequestBody DeleteAccountRequestDto request,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        authService.deleteAccount(user, request, extractBearerToken(authorizationHeader));
        return ApiResponse.ok("Account deleted");
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        return authorizationHeader.substring(7);
    }
}
