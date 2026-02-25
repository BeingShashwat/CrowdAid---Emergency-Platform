ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS thank_points_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE emergencies
    ADD COLUMN IF NOT EXISTS thank_points INTEGER;

ALTER TABLE emergencies
    ADD COLUMN IF NOT EXISTS thanked_at TIMESTAMPTZ;

ALTER TABLE emergencies
    DROP CONSTRAINT IF EXISTS chk_emergency_thank_points;

ALTER TABLE emergencies
    ADD CONSTRAINT chk_emergency_thank_points CHECK (thank_points IS NULL OR (thank_points >= 1 AND thank_points <= 5));
