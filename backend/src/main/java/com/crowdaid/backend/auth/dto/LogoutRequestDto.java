package com.crowdaid.backend.auth.dto;

public record LogoutRequestDto(
    String refreshToken
) {
}
