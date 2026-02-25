package com.crowdaid.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequestDto(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @Email @NotBlank String email,
    @NotBlank String phone,
    @Size(min = 6) String password,
    @NotNull Boolean isVolunteer,
    @NotBlank String otp,
    @NotNull Boolean agreeToTerms,
    @NotNull Boolean agreeToEmergencyContact
) {
}
