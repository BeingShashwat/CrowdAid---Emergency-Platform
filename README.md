# CrowdAid Platform

Full-stack emergency response platform:
- `src/` -> React frontend
- `backend/` -> Spring Boot API
- `docs/LLD.md` -> simplified low-level design

## Local Run

### 1. Frontend
```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

### 2. Backend
```powershell
cd backend
.\scripts\run-backend.ps1
```

## Public Deployment (Recommended)

### Architecture
- Frontend: Vercel / Netlify
- Backend: Render / Railway / Fly.io
- Database: Supabase PostgreSQL

### Supabase DB
Use Supabase Postgres connection details in backend env:
- `DB_URL=jdbc:postgresql://<pooler-host>:6543/postgres?sslmode=require`
- `DB_USERNAME=postgres.<project_ref>`
- `DB_PASSWORD=<db_password>`

### Backend (production)
Set:
- `SPRING_PROFILES_ACTIVE=prod`
- `JWT_SECRET` (32+ chars, strong random)
- `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`
- optional Twilio: `TWILIO_ENABLED=true`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

### Frontend (production)
Set:
- `VITE_API_BASE_URL=https://<your-backend-domain>/api`

## GitHub Publish

This repo is ready to push. `node_modules`, build outputs, and local env files are ignored.

```powershell
git add .
git commit -m "Production-ready CrowdAid with Supabase deployment support"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Security Notes
- Never commit `.env.local`, backend `.env`, Twilio keys, JWT secrets.
- Rotate any API key that was ever shared in chat/logs.
- Run backend only with `prod` profile in public deployment.
