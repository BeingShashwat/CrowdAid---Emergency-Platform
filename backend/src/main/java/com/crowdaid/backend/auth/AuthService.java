package com.crowdaid.backend.auth;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.crowdaid.backend.audit.AuditService;
import com.crowdaid.backend.common.ApiException;
import com.crowdaid.backend.emergency.EmergencyRepository;
import com.crowdaid.backend.emergency.EmergencyStatus;
import com.crowdaid.backend.otp.OtpSecurityService;
import com.crowdaid.backend.otp.OtpCode;
import com.crowdaid.backend.otp.OtpCodeRepository;
import com.crowdaid.backend.otp.OtpSender;
import com.crowdaid.backend.security.SessionTokenService;
import com.crowdaid.backend.user.AppUser;
import com.crowdaid.backend.user.UserRepository;
import com.crowdaid.backend.user.UserRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final Pattern TEN_DIGIT_PATTERN = Pattern.compile("\\d{10}");

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final EmergencyRepository emergencyRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpSecurityService otpSecurityService;
    private final OtpSender otpSender;
    private final SessionTokenService sessionTokenService;
    private final AuditService auditService;

    @Transactional
    public void requestSignupOtp(RequestOtpDto request, String ipAddress) {
        String phone = normalizePhone(request.phone());
        otpSecurityService.checkOtpRequestAllowed(phone, safeIp(ipAddress));
        String otp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 999999));

        OtpCode otpCode = new OtpCode();
        otpCode.setPhone(phone);
        otpCode.setOtpCode(otp);
        otpCode.setExpiresAt(Instant.now().plusSeconds(10 * 60));
        otpCodeRepository.save(otpCode);

        try {
            otpSender.sendOtp(phone, otp);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not send OTP through SMS provider");
        }
    }

    @Transactional
    public void verifySignupOtp(VerifyOtpDto request, String ipAddress) {
        String phone = normalizePhone(request.phone());
        String ip = safeIp(ipAddress);
        otpSecurityService.checkOtpVerifyAllowed(phone, ip);

        OtpCode otpCode = otpCodeRepository
            .findTopByPhoneAndOtpCodeAndConsumedFalseOrderByCreatedAtDesc(phone, request.otp())
            .orElse(null);

        if (otpCode == null) {
            otpSecurityService.recordOtpVerifyFailure(phone, ip);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        if (otpCode.getExpiresAt().isBefore(Instant.now())) {
            otpSecurityService.recordOtpVerifyFailure(phone, ip);
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired");
        }

        otpCode.setVerified(true);
        otpCodeRepository.save(otpCode);
        otpSecurityService.resetOtpVerifyFailures(phone, ip);
    }

    @Transactional
    public AuthResponseDto register(RegisterRequestDto request, String ipAddress, String userAgent) {
        if (!Boolean.TRUE.equals(request.agreeToTerms()) || !Boolean.TRUE.equals(request.agreeToEmergencyContact())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You must accept required terms");
        }

        String email = request.email().toLowerCase(Locale.ROOT);
        String phone = normalizePhone(request.phone());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        OtpCode otpCode = otpCodeRepository
            .findTopByPhoneAndOtpCodeAndConsumedFalseOrderByCreatedAtDesc(phone, request.otp())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP not found"));

        if (otpCode.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired");
        }
        if (!otpCode.isVerified()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP is not verified");
        }

        AppUser user = new AppUser();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Boolean.TRUE.equals(request.isVolunteer()) ? UserRole.VOLUNTEER : UserRole.USER);
        user.setVolunteer(Boolean.TRUE.equals(request.isVolunteer()));
        user.setVerified(true);
        user.setOnline(false);

        AppUser saved = userRepository.save(user);
        otpCode.setConsumed(true);
        otpCodeRepository.save(otpCode);

        SessionTokenService.TokenPair tokenPair = sessionTokenService.issueTokens(saved, safeIp(ipAddress), userAgent);
        auditService.log(saved.getId(), "USER_REGISTERED", "USER", saved.getId().toString(), "role=" + saved.getRole().name());
        return new AuthResponseDto(tokenPair.accessToken(), tokenPair.refreshToken(), toUserDto(saved));
    }

    public AuthResponseDto login(LoginRequestDto request, String ipAddress, String userAgent) {
        AppUser user = userRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        SessionTokenService.TokenPair tokenPair = sessionTokenService.issueTokens(user, safeIp(ipAddress), userAgent);
        return new AuthResponseDto(tokenPair.accessToken(), tokenPair.refreshToken(), toUserDto(user));
    }

    @Transactional
    public AuthResponseDto refresh(RefreshTokenRequestDto request, String ipAddress, String userAgent) {
        SessionTokenService.RefreshResult result = sessionTokenService.refreshTokens(
            request.refreshToken(),
            safeIp(ipAddress),
            userAgent
        );
        return new AuthResponseDto(result.accessToken(), result.refreshToken(), toUserDto(result.user()));
    }

    @Transactional
    public void logout(AppUser user, String accessToken, LogoutRequestDto request) {
        String refreshToken = request == null ? null : request.refreshToken();
        sessionTokenService.revokeRefreshToken(refreshToken);
        sessionTokenService.revokeAccessToken(accessToken, user);
    }

    @Transactional
    public void logoutAll(AppUser user, String accessToken) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        sessionTokenService.revokeAllSessions(user.getId());
        sessionTokenService.revokeAccessToken(accessToken, user);
    }

    public List<UserSessionDto> sessions(AppUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return sessionTokenService.listRecentSessions(user.getId()).stream()
            .map(item -> new UserSessionDto(
                item.getId(),
                item.getIpAddress(),
                item.getUserAgent(),
                item.getCreatedAt(),
                item.getExpiresAt(),
                item.isRevoked()
            ))
            .toList();
    }

    @Transactional
    public void deleteAccount(AppUser user, DeleteAccountRequestDto request, String accessToken) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }

        boolean hasActiveSos = emergencyRepository.existsByUserIdAndStatusIn(
            user.getId(),
            List.of(EmergencyStatus.PENDING, EmergencyStatus.IN_PROGRESS)
        );
        if (hasActiveSos) {
            throw new ApiException(HttpStatus.CONFLICT, "Resolve or cancel active SOS requests before deleting account");
        }
        if (emergencyRepository.countByRespondingVolunteerIdAndStatus(user.getId(), EmergencyStatus.IN_PROGRESS) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Complete your active volunteer responses before deleting account");
        }

        String actorId = user.getId().toString();
        sessionTokenService.revokeAllSessions(user.getId());
        sessionTokenService.revokeAccessToken(accessToken, user);
        userRepository.delete(user);
        auditService.log(null, "ACCOUNT_DELETED", "USER", actorId, "Self-service account deletion");
    }

    public UserDto me(AppUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return toUserDto(user);
    }

    public UserDto toUserDto(AppUser user) {
        return new UserDto(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.isVolunteer(),
            user.isVerified(),
            user.getVolunteerRating() == null ? null : user.getVolunteerRating().doubleValue(),
            user.getThankPointsTotal(),
            user.getTotalHelped(),
            user.getCompletionRate() == null ? null : user.getCompletionRate().doubleValue(),
            user.getAvgResponseTime(),
            user.isOnline(),
            user.getCreatedAt()
        );
    }

    private String normalizePhone(String phone) {
        String raw = phone == null ? "" : phone.trim();
        raw = raw.replaceAll("[\\s\\-()]", "");

        String digits;
        if (raw.startsWith("+")) {
            if (!raw.startsWith("+91")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Only Indian phone numbers (+91) are supported");
            }
            digits = raw.substring(3);
        } else {
            digits = raw;
        }

        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (!TEN_DIGIT_PATTERN.matcher(digits).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phone number must have 10 digits");
        }

        return "+91" + digits;
    }

    private String safeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "unknown";
        }
        return ipAddress.trim();
    }
}
