package com.crowdaid.backend.auth.dto;

public record AuthResponseDto(
    String token,
    String refreshToken,
    UserDto user
) {
}
