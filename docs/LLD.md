# CrowdAid LLD (Simple)

## 1. System Modules
- `frontend` (React + Vite): UI, route guards, dashboard flows, calls backend APIs.
- `backend` (Spring Boot): auth, OTP, emergency workflow, volunteer/admin APIs.
- `database` (PostgreSQL / Supabase): users, OTPs, emergencies, audit, idempotency, sessions.

## 2. Backend Package Boundaries
- `auth`: login/register/refresh/logout/session/account deletion.
- `otp`: OTP persistence, rate-limits, Twilio sender.
- `emergency`: SOS creation, nearby search (Haversine), respond/resolve/cancel/thank points.
- `volunteer`: volunteer stats, history, online status.
- `admin`: system stats and admin operations.
- `security`: JWT filters, idempotency records, session/revoke lists.
- `audit`: immutable event logs.
- `config`: security setup, bootstrap admin, scheduled maintenance jobs.

## 3. Core Flows
- Signup:
  1. `request-otp` -> OTP generated + SMS.
  2. `verify-otp` -> OTP validated.
  3. `register` -> user created + access/refresh tokens issued.
- Login:
  1. `login` -> access + refresh tokens.
  2. access token expiry -> `refresh` rotation.
- SOS:
  1. requester sends `/emergencies/sos` with browser location.
  2. system stores `PENDING`.
  3. nearby volunteers (`<=5km`) fetch `/nearby`.
  4. first volunteer `respond`s -> `IN_PROGRESS`; hidden from others.
  5. requester/volunteer/admin can `resolve`; requester can also `cancel`.
  6. requester submits thank points after resolved.

## 4. Security Model
- Access JWT: short TTL + `jti`.
- Refresh token: server-side session, rotation on each refresh.
- Revocation: access token revoke list + logout-all sessions.
- OTP defense: per-phone and per-IP rate limits + lockouts.
- SOS defense: idempotency keys + anti-spam guards.
- Audit logs: emergency status and admin actions.

## 5. Deployment Layout
- Frontend host: Vercel/Netlify.
- Backend host: Render/Railway/Fly.
- DB host: Supabase Postgres (SSL required).
- Frontend talks only to backend; backend talks to Supabase.
