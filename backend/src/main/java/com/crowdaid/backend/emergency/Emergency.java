package com.crowdaid.backend.emergency;

import java.time.Instant;
import java.util.UUID;

import com.crowdaid.backend.user.AppUser;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "emergencies")
public class Emergency {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(name = "user_name", nullable = false, length = 200)
    private String userName;

    @Column(name = "user_phone", length = 30)
    private String userPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EmergencyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmergencyStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmergencySeverity severity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(nullable = false)
    private int volunteers;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responding_volunteer_id")
    private AppUser respondingVolunteer;

    @Column(name = "volunteer_phone", length = 30)
    private String volunteerPhone;

    @Column(name = "requester_ip", length = 80)
    private String requesterIp;

    @Column(name = "response_time_min")
    private Double responseTimeMin;

    @Column(name = "thank_points")
    private Integer thankPoints;

    @Column(name = "thanked_at")
    private Instant thankedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
