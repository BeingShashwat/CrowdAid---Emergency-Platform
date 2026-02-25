package com.crowdaid.backend.emergency;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LocationDto(
    @NotNull Double latitude,
    @NotNull Double longitude,
    @NotBlank String address
) {
}
