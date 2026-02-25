package com.crowdaid.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequestDto(
    @NotBlank String refreshToken
) {
}
