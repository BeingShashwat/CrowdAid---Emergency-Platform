# Deployment Guide (Supabase + Render + Vercel)

## 1) Create Supabase Database
1. Create a Supabase project.
2. Open `Project Settings -> Database`.
3. Copy:
   - host/port from `Connection pooling` (recommended)
   - database password
   - username (`postgres.<project_ref>`)
4. Build JDBC URL:
   - `jdbc:postgresql://<pooler-host>:6543/postgres?sslmode=require`

## 2) Deploy Backend (Render)
1. Create Web Service from GitHub repo.
2. Root directory: `backend`
3. Build command:
   - `./gradlew --no-daemon bootJar -x test`
4. Start command:
   - `java -jar build/libs/*.jar`
5. Add env vars:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `DB_URL=<supabase_jdbc_url>`
   - `DB_USERNAME=<supabase_username>`
   - `DB_PASSWORD=<supabase_password>`
   - `JWT_SECRET=<32+ random chars>`
   - `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`
   - `ADMIN_EMAIL=<admin_email>`
   - `ADMIN_PASSWORD=<strong_password>`
   - `ADMIN_PHONE=+91XXXXXXXXXX`
   - optional Twilio vars

## 3) Deploy Frontend (Vercel)
1. Import the same GitHub repository.
2. Root directory: project root.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env var:
   - `VITE_API_BASE_URL=https://<render-backend-domain>/api`

## 4) Validate Public Platform
1. Open frontend URL.
2. Signup with OTP (Twilio enabled) or dev OTP logs (Twilio disabled).
3. Create SOS and verify volunteer receive/claim behavior.
4. Verify CORS and JWT refresh flow in browser network tab.
