package com.crowdaid.backend.security;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface RevokedAccessTokenRepository extends JpaRepository<RevokedAccessToken, String> {
    @Transactional
    int deleteByExpiresAtBefore(Instant threshold);
}
