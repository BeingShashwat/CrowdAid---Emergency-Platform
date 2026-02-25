-- Run once as PostgreSQL superuser (for example: postgres).
-- If role/database already exists, skip the corresponding line.

CREATE ROLE crowdaid_user WITH LOGIN PASSWORD 'crowdaid_password';
CREATE DATABASE crowdaid OWNER crowdaid_user;
GRANT ALL PRIVILEGES ON DATABASE crowdaid TO crowdaid_user;

-- After creating DB, connect to "crowdaid" and run:
-- backend/scripts/fix-postgres-permissions.sql
