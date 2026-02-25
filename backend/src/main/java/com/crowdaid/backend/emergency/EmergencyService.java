package com.crowdaid.backend.emergency;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdaid.backend.common.ApiException;
import com.crowdaid.backend.common.PagedResponse;
import com.crowdaid.backend.security.IdempotencyService;
import com.crowdaid.backend.user.AppUser;
import com.crowdaid.backend.user.UserRepository;
import com.crowdaid.backend.user.UserRole;
import com.crowdaid.backend.audit.AuditService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmergencyService {

    private static final double MAX_VOLUNTEER_RADIUS_KM = 5.0;

    private final EmergencyRepository emergencyRepository;
    private final UserRepository userRepository;
    private final EmergencyGuardService emergencyGuardService;
    private final IdempotencyService idempotencyService;
    private final AuditService auditService;

    @Transactional
    public EmergencyDto sendSos(SosRequestDto request, AppUser requester, String requesterIp, String idempotencyKey) {
        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);
        String actorKey = requester == null ? "ip:" + safeIp(requesterIp) : requester.getId().toString();
        String endpoint = "SOS";

        if (normalizedKey != null) {
            EmergencyDto previous = getIdempotentSosResult(actorKey, endpoint, normalizedKey);
            if (previous != null) {
                return previous;
            }
        }

        emergencyGuardService.assertCanCreateSos(requester, safeIp(requesterIp));

        Emergency emergency = new Emergency();
        emergency.setUser(requester);
        emergency.setUserName(requester == null ? "Emergency Requester" : requester.getFirstName() + " " + requester.getLastName());
        emergency.setUserPhone(Boolean.FALSE.equals(request.sharePhone()) || requester == null ? null : requester.getPhone());
        emergency.setType(request.type());
        emergency.setStatus(EmergencyStatus.PENDING);
        emergency.setSeverity(defaultSeverity(request.type()));
        emergency.setDescription(request.description());
        emergency.setLatitude(request.location().latitude());
        emergency.setLongitude(request.location().longitude());
        emergency.setAddress(request.location().address());
        emergency.setRequesterIp(safeIp(requesterIp));
        emergency.setVolunteers(0);

        Emergency saved = emergencyRepository.save(emergency);
        if (normalizedKey != null) {
            idempotencyService.store(actorKey, endpoint, normalizedKey, saved.getId());
        }

        UUID actorId = requester == null ? null : requester.getId();
        auditService.log(actorId, "SOS_CREATED", "EMERGENCY", saved.getId().toString(), "status=PENDING");
        return toDto(saved, null);
    }

    public List<EmergencyDto> getNearby(double lat, double lng, double radiusKm) {
        double effectiveRadius = Math.min(MAX_VOLUNTEER_RADIUS_KM, Math.max(0.5, radiusKm));
        List<EmergencyStatus> active = List.of(EmergencyStatus.PENDING);
        return emergencyRepository.findByStatusInOrderByCreatedAtDesc(active).stream()
            .map(entity -> {
                double distanceKm = haversineKm(lat, lng, entity.getLatitude(), entity.getLongitude());
                return toDto(entity, distanceKm);
            })
            .filter(dto -> dto.distanceKm() != null && dto.distanceKm() <= effectiveRadius)
            .sorted(Comparator.comparing(EmergencyDto::distanceKm))
            .toList();
    }

    public PagedResponse<EmergencyDto> getAll(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size);
        var result = (status == null || status.isBlank())
            ? emergencyRepository.findAllByOrderByCreatedAtDesc(pageable)
            : emergencyRepository.findByStatusOrderByCreatedAtDesc(parseStatus(status), pageable);

        List<EmergencyDto> data = result.getContent().stream()
            .map(entity -> toDto(entity, null))
            .toList();

        return new PagedResponse<>(
            data,
            result.getTotalElements(),
            result.getTotalPages(),
            result.getNumber(),
            result.getSize()
        );
    }

    @Transactional
    public RespondEmergencyResultDto respond(UUID emergencyId, AppUser volunteer, String idempotencyKey) {
        requireVolunteerRole(volunteer);
        String endpoint = "RESPOND:" + emergencyId;
        String actorKey = volunteer.getId().toString();
        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);

        if (normalizedKey != null) {
            RespondEmergencyResultDto previous = getIdempotentRespondResult(actorKey, endpoint, normalizedKey, volunteer);
            if (previous != null) {
                return previous;
            }
        }

        Emergency emergency = emergencyRepository.findByIdForUpdate(emergencyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency not found"));

        if (emergency.getStatus() != EmergencyStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This help request was already accepted");
        }

        emergency.setRespondingVolunteer(volunteer);
        emergency.setVolunteerPhone(volunteer.getPhone());
        emergency.setVolunteers(Math.max(1, emergency.getVolunteers() + 1));
        emergency.setStatus(EmergencyStatus.IN_PROGRESS);
        long seconds = Duration.between(emergency.getCreatedAt(), Instant.now()).toSeconds();
        emergency.setResponseTimeMin(Math.max(0, seconds / 60.0));

        Emergency saved = emergencyRepository.save(emergency);
        if (normalizedKey != null) {
            idempotencyService.store(actorKey, endpoint, normalizedKey, saved.getId());
        }

        auditService.log(
            volunteer.getId(),
            "EMERGENCY_RESPONDED",
            "EMERGENCY",
            saved.getId().toString(),
            "status=IN_PROGRESS"
        );
        EmergencyDto dto = toDto(saved, null);
        return new RespondEmergencyResultDto(saved.getUserPhone(), volunteer.getPhone(), dto);
    }

    @Transactional
    public void resolve(UUID emergencyId, AppUser actor) {
        if (actor == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Emergency emergency = emergencyRepository.findByIdForUpdate(emergencyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency not found"));

        if (emergency.getStatus() == EmergencyStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cancelled emergency cannot be resolved");
        }
        if (emergency.getStatus() == EmergencyStatus.RESOLVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Emergency already resolved");
        }

        boolean isAdmin = actor.getRole() == UserRole.ADMIN;
        boolean isAssignedVolunteer = emergency.getRespondingVolunteer() != null
            && emergency.getRespondingVolunteer().getId().equals(actor.getId());
        boolean isRequester = emergency.getUser() != null
            && emergency.getUser().getId().equals(actor.getId());

        if (!isAdmin && !isAssignedVolunteer && !isRequester) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only requester, assigned volunteer, or admin can resolve");
        }

        if (emergency.getStatus() == EmergencyStatus.PENDING && !isAdmin) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Help is not assigned yet. Cancel the SOS if it is no longer needed."
            );
        }

        emergency.setStatus(EmergencyStatus.RESOLVED);
        if (emergency.getRespondingVolunteer() != null) {
            AppUser volunteer = emergency.getRespondingVolunteer();
            volunteer.setTotalHelped(volunteer.getTotalHelped() + 1);
            userRepository.save(volunteer);
        }
        emergencyRepository.save(emergency);
        auditService.log(actor.getId(), "EMERGENCY_RESOLVED", "EMERGENCY", emergency.getId().toString(), "status=RESOLVED");
    }

    @Transactional
    public void cancel(UUID emergencyId, AppUser actor) {
        Emergency emergency = emergencyRepository.findByIdForUpdate(emergencyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency not found"));

        if (actor.getRole() != UserRole.ADMIN && emergency.getUser() != null
            && !emergency.getUser().getId().equals(actor.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot cancel this emergency");
        }

        emergency.setStatus(EmergencyStatus.CANCELLED);
        emergencyRepository.save(emergency);
        auditService.log(actor.getId(), "EMERGENCY_CANCELLED", "EMERGENCY", emergency.getId().toString(), "status=CANCELLED");
    }

    public List<EmergencyDto> getMyEmergencies(AppUser requester, boolean activeOnly) {
        if (requester == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        List<Emergency> rows = activeOnly
            ? emergencyRepository.findTop50ByUserIdAndStatusInOrderByCreatedAtDesc(
                requester.getId(),
                List.of(EmergencyStatus.PENDING, EmergencyStatus.IN_PROGRESS)
            )
            : emergencyRepository.findTop50ByUserIdOrderByCreatedAtDesc(requester.getId());

        return rows.stream().map(entity -> toDto(entity, null)).toList();
    }

    @Transactional
    public EmergencyDto thankVolunteer(UUID emergencyId, AppUser requester, int points) {
        if (points < 1 || points > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Thank points must be between 1 and 5");
        }

        Emergency emergency = emergencyRepository.findByIdForUpdate(emergencyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Emergency not found"));

        if (requester == null || emergency.getUser() == null || !emergency.getUser().getId().equals(requester.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the requester can thank the volunteer");
        }
        if (emergency.getStatus() != EmergencyStatus.RESOLVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You can thank only after help is completed");
        }
        if (emergency.getRespondingVolunteer() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No volunteer assigned to this help request");
        }
        if (emergency.getThankPoints() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Thank points already submitted for this request");
        }

        emergency.setThankPoints(points);
        emergency.setThankedAt(Instant.now());
        Emergency saved = emergencyRepository.save(emergency);

        AppUser volunteer = saved.getRespondingVolunteer();
        Long totalThanks = emergencyRepository.sumThankPointsByVolunteerId(volunteer.getId());
        volunteer.setThankPointsTotal(totalThanks == null ? 0 : totalThanks.intValue());
        Double avg = emergencyRepository.findAverageThankPointsByVolunteerId(volunteer.getId());
        volunteer.setVolunteerRating(avg == null ? null : java.math.BigDecimal.valueOf(avg));
        userRepository.save(volunteer);
        auditService.log(requester.getId(), "THANK_POINTS_SUBMITTED", "EMERGENCY", saved.getId().toString(), "points=" + points);

        return toDto(saved, null);
    }

    public byte[] exportCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("id,userName,userPhone,type,status,severity,address,volunteers,responseTimeMin,thankPoints,requesterIp,createdAt,updatedAt\n");
        DateTimeFormatter formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

        emergencyRepository.findAll().forEach(item -> {
            sb.append(csv(item.getId())).append(',')
                .append(csv(item.getUserName())).append(',')
                .append(csv(item.getUserPhone())).append(',')
                .append(csv(item.getType().name())).append(',')
                .append(csv(item.getStatus().name())).append(',')
                .append(csv(item.getSeverity().name())).append(',')
                .append(csv(item.getAddress())).append(',')
                .append(item.getVolunteers()).append(',')
                .append(item.getResponseTimeMin() == null ? "" : item.getResponseTimeMin()).append(',')
                .append(item.getThankPoints() == null ? "" : item.getThankPoints()).append(',')
                .append(csv(item.getRequesterIp())).append(',')
                .append(csv(formatter.format(item.getCreatedAt()))).append(',')
                .append(csv(formatter.format(item.getUpdatedAt()))).append('\n');
        });

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public EmergencyDto toDto(Emergency entity, Double distanceKm) {
        String userId = entity.getUser() == null ? null : entity.getUser().getId().toString();
        return new EmergencyDto(
            entity.getId(),
            userId,
            entity.getUserName(),
            entity.getUserPhone(),
            entity.getType(),
            entity.getStatus(),
            entity.getSeverity(),
            entity.getDescription(),
            new LocationDto(entity.getLatitude(), entity.getLongitude(), entity.getAddress()),
            distanceKm == null ? null : round(distanceKm, 2),
            entity.getVolunteers(),
            entity.getResponseTimeMin(),
            entity.getUserPhone(),
            entity.getVolunteerPhone(),
            entity.getThankPoints(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    private void requireVolunteerRole(AppUser user) {
        if (user.getRole() == UserRole.ADMIN) {
            return;
        }
        if (user.getRole() != UserRole.VOLUNTEER && !user.isVolunteer()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only volunteers can respond to emergencies");
        }
    }

    private EmergencyStatus parseStatus(String value) {
        try {
            return EmergencyStatus.valueOf(value.trim().toUpperCase(Locale.ROOT).replace('-', '_'));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status filter");
        }
    }

    private EmergencySeverity defaultSeverity(EmergencyType type) {
        return switch (type) {
            case MEDICAL, FIRE, NATURAL_DISASTER -> EmergencySeverity.HIGH;
            case VEHICLE_ACCIDENT, PERSONAL_SAFETY -> EmergencySeverity.MEDIUM;
            case LOST_PERSON, OTHER -> EmergencySeverity.LOW;
        };
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int earthRadiusKm = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private double round(double value, int scale) {
        double factor = Math.pow(10, scale);
        return Math.round(value * factor) / factor;
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value).replace("\"", "\"\"");
        return "\"" + text + "\"";
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }
        String normalized = idempotencyKey.trim();
        if (normalized.length() > 160) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Idempotency-Key is too long");
        }
        return normalized;
    }

    private EmergencyDto getIdempotentSosResult(String actorKey, String endpoint, String key) {
        return idempotencyService.findEmergencyId(actorKey, endpoint, key)
            .flatMap(emergencyRepository::findById)
            .map(row -> toDto(row, null))
            .orElse(null);
    }

    private RespondEmergencyResultDto getIdempotentRespondResult(
        String actorKey,
        String endpoint,
        String key,
        AppUser volunteer
    ) {
        return idempotencyService.findEmergencyId(actorKey, endpoint, key)
            .flatMap(emergencyRepository::findById)
            .filter(row -> row.getRespondingVolunteer() != null
                && row.getRespondingVolunteer().getId().equals(volunteer.getId()))
            .map(row -> new RespondEmergencyResultDto(row.getUserPhone(), volunteer.getPhone(), toDto(row, null)))
            .orElse(null);
    }

    private String safeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "unknown";
        }
        return ipAddress.trim();
    }
}
