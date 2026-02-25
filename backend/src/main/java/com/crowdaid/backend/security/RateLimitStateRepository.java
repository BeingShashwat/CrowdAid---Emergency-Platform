package com.crowdaid.backend.security;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface RateLimitStateRepository extends JpaRepository<RateLimitState, Long> {
    Optional<RateLimitState> findByScopeAndActorKey(RateLimitScope scope, String actorKey);

    @Transactional
    void deleteByUpdatedAtBefore(Instant threshold);
}
