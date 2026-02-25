-- Run this once as PostgreSQL superuser (for example: postgres)
-- while connected to database: crowdaid
--
-- Purpose:
-- 1) make app role own existing public objects
-- 2) grant full access to current and future objects
-- 3) remove "permission denied" errors like:
--    permission denied for table rate_limit_states

DO $$
DECLARE
    obj RECORD;
BEGIN
    FOR obj IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO crowdaid_user', obj.tablename);
    END LOOP;

    FOR obj IN
        SELECT sequencename
        FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE public.%I OWNER TO crowdaid_user', obj.sequencename);
    END LOOP;
END $$;

GRANT USAGE, CREATE ON SCHEMA public TO crowdaid_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO crowdaid_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO crowdaid_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO crowdaid_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES TO crowdaid_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO crowdaid_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON FUNCTIONS TO crowdaid_user;
