package com.crowdaid.backend.emergency;

public record RespondEmergencyResultDto(
    String requesterPhone,
    String volunteerPhone,
    EmergencyDto emergency
) {
}
