package com.crowdaid.backend.volunteer;

import jakarta.validation.constraints.NotNull;

public record OnlineStatusRequestDto(
    @NotNull Boolean isOnline
) {
}
