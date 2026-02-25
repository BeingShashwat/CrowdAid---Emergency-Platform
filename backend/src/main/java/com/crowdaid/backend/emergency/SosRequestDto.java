package com.crowdaid.backend.emergency;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SosRequestDto(
    @NotNull EmergencyType type,
    @Valid @NotNull LocationDto location,
    String description,
    Boolean sharePhone
) {
}
