# Single-Click Certificate Email Sender System

A web-based system that automates sending **participation or completion certificates** to a large number of participants by email. Each participant receives a **personalized email** with a **unique PDF certificate** attached. The entire process is automated and handled by the backend.

---

## Project Overview

In colleges, hackathons, workshops, webinars, and training programs, organizers often need to send certificates to hundreds of participants.

**Problems solved:**
- Manual email sending is time-consuming
- Gmail does not support dynamic attachments per user
- High chance of mistakes (wrong name, missing attachment)
- No tracking of who received certificates
- No retry mechanism for failed emails

**This project provides:**
- A centralized platform where the admin adds participant details
- Automatic certificate generation (unique PDF per participant)
- Automated bulk email sending via SendGrid
- Delivery status tracking (Sent / Failed)
- **One-click** bulk send

---

## User Roles

| Role | Actions |
|------|--------|
| **Admin** | Logs in, adds participants, triggers certificate send, monitors status |
| **Participants** | Do not log in; they only receive emails with certificates |

---

## Core Functionality

1. **Participant Management** – Store name, email, event name, certificate ID, and sending status in the database.
2. **Certificate Generation** – One template; for each participant the system inserts name, event name, certificate ID, and date into a unique PDF.
3. **Automated Email Sending** – SendGrid integration: personalized email with PDF attachment per participant.
4. **Single-Click Bulk Send** – Admin clicks one button; system fetches pending participants, generates PDFs, sends emails, updates status.
5. **Status Tracking & Error Handling** – Track Sent / Failed; prevent duplicate sends; retry failed ones if needed.

---

## Workflow (Step-by-Step)

1. Admin logs into the system  
2. Admin adds participant details  
3. Participant data is saved in the database  
4. Admin clicks **Send Certificates**  
5. System generates certificate PDFs  
6. System sends emails with attachments  
7. System updates delivery status  
8. Admin views final report (Sent / Failed counts and list)

---

## Technology Used

- **Frontend:** Next.js (App Router), React, JavaScript
- **Backend:** Express, Prisma ORM, MySQL, JWT auth
- **Email:** SendGrid API
- **PDF:** pdf-lib for certificate generation
- **Config:** Environment variables for database, JWT, SendGrid

---

## Project Structure

```
Email-Sender/
├── frontend/          # Next.js + React UI
│   ├── app/
│   │   ├── page.js         # Home (problem, solution, workflow)
│   │   ├── login/
│   │   ├── signup/
│   │   └── dashboard/      # Add participants, Send Certificates, status list
│   ├── components/
│   │   └── Navbar.js
│   └── lib/api.js          # API URL + token helpers
├── backend/           # Express API
│   ├── server.js
│   ├── routes/        # auth, participants, send-certificates
│   ├── lib/           # prisma, auth (JWT), sendgrid, pdfGenerator
│   └── prisma/schema.prisma
└── README.md
```

---

## Setup & Run

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit **backend/.env**: `DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `PORT` (default 3001).

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Backend runs at **http://localhost:3001**.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit **frontend/.env**: `NEXT_PUBLIC_API_URL=http://localhost:3001`.

```bash
npm run dev
```

Frontend runs at **http://localhost:3000**.

### Using the App

1. Open **http://localhost:3000**
2. **Sign up** or **Login** (seed admin: `admin@example.com` / `admin123`)
3. Go to **Dashboard** → add participants → click **Send Certificates**
4. View **Participants & Status** (PENDING / SENT / FAILED)

---

## Final Goal

A simple, scalable, and automated certificate distribution system that works reliably for real-world events and removes the need for manual email sending.

---

## License

MIT
