# 🎓 Certificate Automator - Project Workflow & Plan

This document explains exactly how the **Single-Click Certificate Email Sender** works from start to finish.

---

## 🏗 High-Level Architecture
1. **Frontend (Next.js)**: A premium admin dashboard to upload data, set templates, and monitor sending status in real-time.
2. **Backend (Express/Node.js)**: The engine that processes files, generates PDFs, and talks to the email server.
3. **Database (MySQL + Prisma)**: Stores participant information, unique certificate IDs, and delivery statuses.
4. **Email Service (SMTP/Brevo)**: The "delivery man" that sends the final emails with attachments.

---

## 🔄 The 5-Step Workflow

### 1. Configuration (`.env`)
The project reads your "Brevo" or other SMTP credentials from the `.env` file. This tells the system *who* is sending the email and *how* to connect to the mail server.

### 2. Custom Design (Optional)
On the dashboard, you can upload a **Blank PDF Template**.
- **How it works**: The backend saves this in the `/uploads` folder.
- **Logic**: If a file exists, the system uses it as the background. If not, it falls back to its built-in professional design.

### 3. Smart Bulk Import (Excel/CSV)
You upload your student list spreadsheet.
- **Header Parsing**: The system uses **Flexible Mapping**. It looks for keywords like "Name", "Email", "Event", "Project", etc., so you don't have to rename your columns.
- **Database Entry**: Each student is assigned a **Unique 12-character Certificate ID** and saved with a `PENDING` status.

### 4. Generation & Sending Engine
When the "Send" process starts (automated after upload):
1. **Fetch**: The system pulls all `PENDING` students from the database.
2. **Generate**: It uses the `pdf-lib` engine to take the template (or default) and "print" the Student's Name, Event Name, and Date at specific coordinates.
3. **Attach**: The PDF is converted into a **Base64 string** (no temporary files saved, very fast).
4. **Send**: `Nodemailer` sends the email with the PDF attached directly to the student's inbox.

### 5. Real-Time Tracking
The dashboard refreshes every time an email is processed.
- ✅ **SENT**: Email delivered successfully.
- ❌ **FAILED**: Something went wrong (e.g., invalid email). You can retry later.

---

## 🛠 Tech Stack Details
| Feature | Library |
| :--- | :--- |
| **PDF Creation** | `pdf-lib` |
| **Email Sending** | `nodemailer` |
| **Excel Parsing** | `xlsx` |
| **ORM / DB** | `Prisma` + `MySQL` |
| **File Uploads** | `multer` |

---

## 📂 Project Structure (Where to find what)
- `backend/lib/pdfGenerator.js`: The "Artist" (creates the PDFs).
- `backend/lib/mailer.js`: The "Postman" (sends the emails).
- `backend/routes/participants.js`: Handles Excel uploads and data management.
- `backend/routes/send-certificates.js`: The "Director" (orchestrates the whole flow).
- `frontend/app/dashboard/page.js`: The "Stage" (the UI you interact with).
