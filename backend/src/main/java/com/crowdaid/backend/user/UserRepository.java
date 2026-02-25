package com.crowdaid.backend.user;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    List<AppUser> findByRoleOrIsVolunteerTrue(UserRole role);

    @Query("select count(u) from AppUser u where u.role = :role or u.isVolunteer = true")
    long countVolunteers(UserRole role);

    @Query("select count(u) from AppUser u where (u.role = :role or u.isVolunteer = true) and u.isOnline = true")
    long countOnlineVolunteers(UserRole role);
}
