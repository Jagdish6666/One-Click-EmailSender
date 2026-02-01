# Backend – Certificate Email Sender

Express API with Prisma (MySQL), JWT auth, SendGrid, and PDF generation.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set DATABASE_URL, JWT_SECRET, SENDGRID_*, PORT
3. `npx prisma migrate dev --name init`
4. `npx prisma db seed` (optional – creates admin@example.com / admin123)

## Run

```bash
npm run dev
```

Runs on http://localhost:3001 (or PORT from .env).

## Routes

- POST /api/auth/login, /api/auth/signup, /api/auth/logout
- GET /api/auth/me (requires Bearer token)
- GET /api/participants, POST /api/participants (require Bearer token)
- POST /api/send-certificates (requires Bearer token)
