# CrowdAid Full Stack

This workspace now contains:

- `frontend` (root React + Vite app)
- `backend/` (Spring Boot + PostgreSQL API)

## Prerequisites

- Node.js 18+
- Java 21
- PostgreSQL 16+ (or Docker Desktop to run Postgres container)

## Frontend Setup

From project root:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000` and proxies `/api` to `http://localhost:8080`.

## Backend Setup (Spring Boot + PostgreSQL)

See full backend guide: `backend/README.md`

Quick commands:

```powershell
cd backend
.\scripts\run-backend.ps1
```

Before running backend, make sure PostgreSQL is available and env vars are set:

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/crowdaid`)
- `DB_USERNAME` (default: `crowdaid_user`)
- `DB_PASSWORD` (default: `crowdaid_password`)
- `JWT_SECRET` (must be 32+ chars)
- `JWT_ACCESS_EXPIRATION_MINUTES` (default: `15`)
- `JWT_REFRESH_EXPIRATION_DAYS` (default: `14`)
- `TWILIO_ENABLED`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (for real OTP SMS)

Flyway migrations are included and run automatically on startup.

## Implemented Backend APIs

- `POST /api/auth/login`
- `POST /api/auth/register/request-otp`
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/logout-all`
- `GET /api/auth/me`
- `GET /api/auth/sessions`
- `DELETE /api/auth/me`
- `POST /api/emergencies/sos`
- `GET /api/emergencies/nearby`
- `GET /api/emergencies`
- `POST /api/emergencies/{id}/respond`
- `POST /api/emergencies/{id}/resolve`
- `POST /api/emergencies/{id}/cancel`
- `GET /api/emergencies/my`
- `POST /api/emergencies/{id}/thank`
- `GET /api/emergencies/export`
- `GET /api/volunteers/me/stats`
- `GET /api/volunteers/me/activity`
- `PATCH /api/volunteers/me/status`
- `GET /api/volunteers/leaderboard`
- `GET /api/admin/stats`
- `GET /api/location/reverse-geocode`
"# CrowdAid---Emergency-Platform" 
