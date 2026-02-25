package com.crowdaid.backend.audit;

import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(UUID actorUserId, String action, String entityType, String entityId, String details) {
        AuditLog row = new AuditLog();
        row.setActorUserId(actorUserId);
        row.setAction(action);
        row.setEntityType(entityType);
        row.setEntityId(entityId);
        row.setDetails(details);
        auditLogRepository.save(row);
    }
}
