# CrowdAid Backend (Spring Boot)

## Local Setup

### 1) Start PostgreSQL
Use Docker:
```powershell
cd backend
docker compose up -d
```

Or local PostgreSQL + scripts:
1. run `scripts/init-postgres.sql` as superuser
2. connect to DB `crowdaid`
3. run `scripts/fix-postgres-permissions.sql` as superuser

### 2) Run API
```powershell
cd backend
.\scripts\run-backend.ps1
```

For production profile locally:
```powershell
cd backend
.\scripts\run-backend-prod.ps1
```

## Production Setup (Supabase)

Use `SPRING_PROFILES_ACTIVE=prod` and set:
- `DB_URL` (Supabase pooler URL with `sslmode=require`)
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`

Example:
```bash
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
DB_USERNAME=postgres.<project_ref>
DB_PASSWORD=<supabase_db_password>
JWT_SECRET=<very-long-random-secret>
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-admin-password>
ADMIN_PHONE=+919000000000
```

## Build
```powershell
cd backend
.\gradlew.bat --no-daemon build -x test
```

## Container Deploy (optional)
Build image:
```bash
docker build -t crowdaid-backend ./backend
```
Run:
```bash
docker run -p 8080:8080 --env-file backend/.env.example crowdaid-backend
```

## Security Controls Included
- JWT access + refresh rotation
- Revoke list + logout-all sessions
- OTP brute-force protection (phone/IP)
- SOS idempotency keys
- Audit logging for admin/emergency actions
- Fraud pattern background scans
