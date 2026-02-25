package com.crowdaid.backend.security;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRecordRepository idempotencyRecordRepository;

    public Optional<UUID> findEmergencyId(String actorKey, String endpoint, String idempotencyKey) {
        return idempotencyRecordRepository
            .findByActorKeyAndEndpointAndIdempotencyKey(actorKey, endpoint, idempotencyKey)
            .map(IdempotencyRecord::getEmergencyId);
    }

    @Transactional
    public void store(String actorKey, String endpoint, String idempotencyKey, UUID emergencyId) {
        IdempotencyRecord row = new IdempotencyRecord();
        row.setActorKey(actorKey);
        row.setEndpoint(endpoint);
        row.setIdempotencyKey(idempotencyKey);
        row.setEmergencyId(emergencyId);
        try {
            idempotencyRecordRepository.save(row);
        } catch (DataIntegrityViolationException ignored) {
            // Request replay detected; caller can fetch previous result.
        }
    }

    @Transactional
    public void cleanup(Instant threshold) {
        idempotencyRecordRepository.deleteByCreatedAtBefore(threshold);
    }
}
