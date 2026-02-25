package com.crowdaid.backend.security;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    List<UserSession> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Transactional
    @Query("""
        update UserSession s
        set s.revoked = true, s.revokedAt = :revokedAt
        where s.user.id = :userId and s.revoked = false
    """)
    int revokeAllByUserId(@Param("userId") UUID userId, @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Transactional
    @Query("""
        update UserSession s
        set s.revoked = true, s.revokedAt = :revokedAt
        where s.refreshTokenHash = :refreshTokenHash and s.revoked = false
    """)
    int revokeByRefreshTokenHash(@Param("refreshTokenHash") String refreshTokenHash, @Param("revokedAt") Instant revokedAt);

    @Transactional
    int deleteByExpiresAtBefore(Instant threshold);
}
