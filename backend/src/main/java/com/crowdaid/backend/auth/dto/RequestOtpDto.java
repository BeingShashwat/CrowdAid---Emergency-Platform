package com.crowdaid.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestOtpDto(
    @NotBlank String phone
) {
}
