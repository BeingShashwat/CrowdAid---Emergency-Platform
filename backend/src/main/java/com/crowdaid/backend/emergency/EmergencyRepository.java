package com.crowdaid.backend.emergency;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface EmergencyRepository extends JpaRepository<Emergency, UUID> {
    List<Emergency> findByStatusInOrderByCreatedAtDesc(Collection<EmergencyStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Emergency e where e.id = :id")
    Optional<Emergency> findByIdForUpdate(@Param("id") UUID id);

    Page<Emergency> findByStatusOrderByCreatedAtDesc(EmergencyStatus status, Pageable pageable);

    Page<Emergency> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatusIn(Collection<EmergencyStatus> statuses);

    long countByStatus(EmergencyStatus status);

    long countByStatusAndUpdatedAtAfter(EmergencyStatus status, Instant after);

    long countByRespondingVolunteerId(UUID volunteerId);

    long countByRespondingVolunteerIdAndStatus(UUID volunteerId, EmergencyStatus status);

    boolean existsByUserIdAndStatusIn(UUID userId, Collection<EmergencyStatus> statuses);

    long countByUserIdAndCreatedAtAfter(UUID userId, Instant after);

    long countByRequesterIpAndCreatedAtAfter(String requesterIp, Instant after);

    List<Emergency> findByRespondingVolunteerIdOrderByCreatedAtDesc(UUID volunteerId);

    List<Emergency> findTop100ByRespondingVolunteerIdOrderByCreatedAtDesc(UUID volunteerId);

    List<Emergency> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Emergency> findTop50ByUserIdAndStatusInOrderByCreatedAtDesc(UUID userId, Collection<EmergencyStatus> statuses);

    @Query("select avg(e.thankPoints) from Emergency e where e.respondingVolunteer.id = :volunteerId and e.thankPoints is not null")
    Double findAverageThankPointsByVolunteerId(@Param("volunteerId") UUID volunteerId);

    @Query("select coalesce(sum(e.thankPoints), 0) from Emergency e where e.respondingVolunteer.id = :volunteerId and e.thankPoints is not null")
    Long sumThankPointsByVolunteerId(@Param("volunteerId") UUID volunteerId);

    @Query("""
        select e.userPhone, count(e)
        from Emergency e
        where e.createdAt >= :since and e.userPhone is not null and e.userPhone <> ''
        group by e.userPhone
        having count(e) >= :threshold
    """)
    List<Object[]> findFrequentPhonesSince(@Param("since") Instant since, @Param("threshold") long threshold);

    @Query("""
        select e.requesterIp, count(e)
        from Emergency e
        where e.createdAt >= :since and e.requesterIp is not null and e.requesterIp <> ''
        group by e.requesterIp
        having count(e) >= :threshold
    """)
    List<Object[]> findFrequentIpsSince(@Param("since") Instant since, @Param("threshold") long threshold);
}
