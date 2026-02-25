package com.crowdaid.backend.otp;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByPhoneOrderByCreatedAtDesc(String phone);

    Optional<OtpCode> findTopByPhoneAndOtpCodeAndConsumedFalseOrderByCreatedAtDesc(String phone, String otpCode);
}
