package com.crowdaid.backend.emergency;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ThankVolunteerRequestDto(
    @NotNull @Min(1) @Max(5) Integer points
) {
}
