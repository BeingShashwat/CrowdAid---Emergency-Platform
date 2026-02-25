CREATE TABLE IF NOT EXISTS rate_limit_states (
    id BIGSERIAL PRIMARY KEY,
    scope VARCHAR(50) NOT NULL,
    actor_key VARCHAR(160) NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(scope, actor_key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_scope_actor ON rate_limit_states(scope, actor_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_lockout ON rate_limit_states(lockout_until);

ALTER TABLE emergencies
    ADD COLUMN IF NOT EXISTS requester_ip VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_emergency_requester_ip_created ON emergencies(requester_ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_user_created ON emergencies(user_id, created_at DESC);

ALTER TABLE emergencies
    DROP CONSTRAINT IF EXISTS emergencies_user_id_fkey;

ALTER TABLE emergencies
    ADD CONSTRAINT emergencies_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE SET NULL;

ALTER TABLE emergencies
    DROP CONSTRAINT IF EXISTS emergencies_responding_volunteer_id_fkey;

ALTER TABLE emergencies
    ADD CONSTRAINT emergencies_responding_volunteer_id_fkey
        FOREIGN KEY (responding_volunteer_id)
        REFERENCES app_users(id)
        ON DELETE SET NULL;

ALTER TABLE user_sessions
    DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

ALTER TABLE user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE;

ALTER TABLE revoked_access_tokens
    DROP CONSTRAINT IF EXISTS revoked_access_tokens_user_id_fkey;

ALTER TABLE revoked_access_tokens
    ADD CONSTRAINT revoked_access_tokens_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE SET NULL;
