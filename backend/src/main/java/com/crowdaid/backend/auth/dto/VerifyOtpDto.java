package com.crowdaid.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyOtpDto(
    @NotBlank String phone,
    @NotBlank String otp
) {
}
