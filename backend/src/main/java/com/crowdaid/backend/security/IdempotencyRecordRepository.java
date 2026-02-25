package com.crowdaid.backend.security;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {
    Optional<IdempotencyRecord> findByActorKeyAndEndpointAndIdempotencyKey(
        String actorKey,
        String endpoint,
        String idempotencyKey
    );

    @Transactional
    void deleteByCreatedAtBefore(Instant threshold);
}
