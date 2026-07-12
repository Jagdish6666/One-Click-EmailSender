# ✉️ One-Click EmailSender & Certificate Generator

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![Secured with Clerk](https://img.shields.io/badge/Secured%20by-Clerk-blueviolet.svg)](https://clerk.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-ready, high-performance, full-stack application designed to automate the dynamic generation of personalized PDF certificates and distribute them via email to thousands of participants simultaneously. 

Combining a highly interactive **Next.js & Tailwind CSS** frontend with a robust, asynchronous **Spring Boot** backend, this platform enables administrators to upload participant directories (via Excel), calibrate text coordinates on PDF templates in real-time, and execute resilient bulk dispatch pipelines.

---

## 🏗️ System Architecture

The project is designed following a **separation of concerns** pattern. The React client acts as the administrative portal, while the Spring Boot backend runs as a stateless RESTful service secured via JWT OAuth2 validation.

```mermaid
graph TD
    %% User/Client Lifecycle
    Admin([Administrator]) -->|Interacts| Frontend[Next.js Portal - React/Tailwind]
    Frontend -->|JWT Authentication| Clerk[Clerk Auth Gateway]
    
    %% API Requests Gateway
    Frontend -->|Authorized REST Requests| SpringSecurity[Spring Security OAuth2 Resource Server]
    SpringSecurity -->|Decodes JWKS Key| Clerk
    
    %% REST Endpoints
    SpringSecurity -->|Expose API| Controllers[API Controllers]
    
    %% Backend Orchestration
    Controllers -->|Batch/Excel Import| ParticipantService[Participant Service]
    Controllers -->|Calibrate Templates| TemplateService[Template Controller]
    Controllers -->|Bulk Trigger| BulkService[Bulk Certificate Service]
    
    %% Async Processing Pipeline
    subgraph Asynchronous Worker Context (TaskExecutor)
        BulkService -->|Job Dispatched| TaskExecutor[ThreadPoolTaskExecutor Engine]
        TaskExecutor -->|Load Templates| PDFGenerator[Certificate PDF Generator]
        PDFGenerator -->|iText/OpenPDF Stamp| PDF[In-memory PDF Bytes]
        PDF -->|Deliver Package| EmailService[Multi-tier Email Service]
    end
    
    %% Database and Third-Party Integrations
    ParticipantService -->|JPA/Hibernate| MySQL[(MySQL Database)]
    TemplateService -->|Upload Array| MySQL
    
    %% Email Fallback System
    EmailService -->|1. Primary Channel| SendGrid[SendGrid REST API Gateway]
    EmailService -->|2. Resilient Fallback| SMTP[SMTP Server - Mailjet/Local]
    
    %% Database Status Updates
    TaskExecutor -->|Persist SENT/FAILED status| MySQL
```

---

## ⚡ Key Features

*   **Excel Importing (Apache POI)**: Import thousands of participants in a single click by uploading `.xlsx` directories.
*   **Virtual Template Calibration**: Directly upload base PDF templates and dynamically calibrate the exact coordinate offset (`nameY`, `eventY`, and `fontSize`) via the UI to align name positioning on different PDF template styles.
*   **Resilient Asynchronous Processing**: Bulk processes are offloaded to background threads using a custom `TaskExecutor` thread pool, preventing HTTP timeouts and ensuring immediate client feedback (HTTP `202 Accepted`).
*   **Intelligent Auto-Fallback Emailing**: Primary delivery leverages the high-throughput **SendGrid REST API**. In the event of rate-limiting or network exceptions, the platform automatically falls back to secondary **JavaMail SMTP** servers (e.g., Mailjet).
*   **Secure OAuth2 Token Validation**: Incorporates Clerk's JSON Web Key Sets (JWKS) to validate signatures of authenticated REST calls statelessly on the backend.

---

## 🔧 Technical Stack Details

### **Frontend**
*   **Framework**: Next.js (React Server Components, App Router)
*   **Styling**: Tailwind CSS & Glassmorphism design tokens for a premium UI feel.
*   **Client Communications**: Axios (featuring interceptors to automatically inject security headers).
*   **Identity & Authentication**: Clerk React SDK. 

### **Backend**
*   **Core Engine**: Spring Boot 3 & Java 17
*   **Database access**: Spring Data JPA & Hibernate
*   **Security Framework**: Spring Security (OAuth2 Resource Server configuration)
*   **File Parsing**: Apache POI (Excel input stream extraction)
*   **Document Generation Engine**: OpenPDF / iText lib (overlay stamping canvas)
*   **RDBMS**: MySQL
*   **Dependencies management**: Maven / Gradle

---

## 🚀 How It Works (Developer Deep Dive)

Here is a step-by-step breakdown of how data flows through the system:

1.  **Template Setup & Calibration**: An admin uploads a raw certificate PDF. The byte array is stored directly in MySQL (`CertificateTemplate`). Adjusting slider values on the dashboard calls `/api/templates/alignment` to calibrate coordinates.
2.  **Participant Database Ingestion**: Uploading an Excel file parses rows into individual `Participant` records. All new ingestion is created with `Status.PENDING`.
3.  **Initiating the Pipeline**: When the user clicks "Send", `CertificateController` invokes `BulkCertificateService.startPendingCertificateProcessing()`.
4.  **Asynchronous Thread Hand-off**: An `AtomicBoolean` guard acts as a thread lock preventing dual bulk execution jobs. A worker thread is immediately spawned from Spring's `TaskExecutor`. The controller responds *instantly* to the UI.
5.  **PDF Overlay & Generation**: The helper class `CertificatePdfGenerator` reads the active PDF template, targets the coordinates from the database, uses `BaseFont.HELVETICA_BOLD` to print the participant's name (in uppercase) and the event title, and outputs the result as a lightweight in-memory `byte[]`.
6.  **Fail-safe Dispatch**: `EmailService` encodes the PDF bytes to Base64, wraps it in a SendGrid Attachment payload, and fires it off. If SendGrid errors or has no API key configurated, the service catches the exception and immediately defaults to the configured SMTP JavaMail provider.
7.  **Real-Time Progress State**: The execution status is updated to `Status.SENT` or `Status.FAILED` in the database, allowing admins to track progress live from the frontend dashboard.

---

## 🔮 The Road to Production & Interview Talking Points

*If asked in an interview how you would scale this application or improve it further:*

### **Interviewer Answer Guide (Talking Points)**

#### **1. How do you handle high scalability if there are 100,000+ files to send?**
*"Currently, the Spring Boot app processes files using an in-memory thread pool (`TaskExecutor`). For enterprise scale, this monolithic design can create bottlenecks on CPU memory (PDF generation) and thread allocation. I would migrate this to a **Microservices Architecture with an Event-Driven Queue**:"*
*   **Producer Service**: Accepts Excel files, stores metadata in MySQL, and publishes a JSON event like `participant.created` to an **Apache Kafka** or **RabbitMQ** queue.
*   **PDF Processing Workers**: Multiple stateless Go/Node.js or Spring Boot microservices consume these messages, scaling horizontally. They fetch the base template (ideally cached in Redis or AWS S3), render the PDF, and store it on **Amazon S3 CDN** storage.
*   **Notification Dispatchers**: A dedicated microservice consumes the S3 links, fetches customer email templates, and sends emails utilizing message rate limits.

#### **2. Why use Clerk instead of custom database JWT auth?**
*"Custom JWT authentication leaves security details like token refresh, session revocation, token verification, security auditing, and OAuth provider management (Google/GitHub integration) up to the developer, which is highly error-prone. Clerk provides advanced user management features, multi-factor authentication (MFA), and bot detection out-of-the-box. Securing the Spring Boot backend is as simple as validating the token's signature using Clerk's JWKS (JSON Web Key Set) public keys, keeping the backend stateless and secure."*

#### **3. Why use a fallback mail-delivery layer?**
*"In business-critical operations, email deliverability is key. If a third-party gateway (like SendGrid) suffers downtime or hits quota limits, having an automated SMTP fallback guarantees that the application retains 100% service availability with no manual intervention."*

---

## 🛠️ Step-by-Step Setup and Execution

To run this application locally, ensure you have **Java 17**, **Node.js 18+**, and **MySQL** installed.

### **1. Database Setup**
Set up your MySQL database and configurations in `backend/.env` (which is git-ignored to keep your credentials safe):
```properties
DATABASE_URL=jdbc:mysql://localhost:3306/certificate_sender?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
DATABASE_USER=your_mysql_user
DATABASE_PASSWORD=your_mysql_password
```

### **2. Running the Backend**
Dependencies can be installed and the app run via Maven:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### **3. Running the Frontend**
Install node packages and run the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```

The portal will be running locally at `http://localhost:3000`.
