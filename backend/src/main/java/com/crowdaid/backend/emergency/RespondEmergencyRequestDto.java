package com.crowdaid.backend.emergency;

import jakarta.validation.constraints.AssertTrue;

public record RespondEmergencyRequestDto(
    @AssertTrue(message = "You must confirm that you are volunteering for this request")
    Boolean confirmVolunteer
) {
}
