# System Architecture: One-Click EmailSender

## 1. High-Level Architecture Summary

The system is designed as a **Modular Monolith**. All six logical services are deployed within a single Spring Boot application runtime, but they are strictly isolated by package boundaries and communicate via defined service interfaces rather than direct database sharing. This choice was made because, at the current scale, the latency and deployment complexity of network hops between distributed microservices outweighs their benefits. A modular monolith provides the internal decoupling necessary for future extraction while maintaining a simplified CI/CD pipeline and zero internal serialization overhead. The trigger to migrate to physical microservices will be when CPU-bound PDF generation begins starving I/O-bound email dispatch threads, or when we hit the bounds of vertical scaling for the single JVM heap.

## 2. Component Diagram

```text
                                        ┌───────────────┐
                                        │ Clerk (JWKS)  │
                                        └───────▲───────┘
                                                │ (HTTPS)
┌───────────────────────────────────────────────┼─────────────────────────────────────────────┐
│ SPRING BOOT MODULAR MONOLITH                  │                                             │
│                                               ▼                                             │
│                                               ┌────────────────┐                                    │
│                                               │ API Gateway    │◄───── (HTTP/JWT) ───── NEXT.JS     │
│                                               │ (Routing/Auth) │                        FRONTEND    │
│                                               └───────┬────────┘                                    │
│                                               │                                             │
│  ┌──────────────────────┐             ┌───────▼────────────────┐                            │
│  │ 2. Participant       │◄────────────┤ 6. Bulk Orchestration  │                            │
│  │    Service           │             │    Service             │                            │
│  └───────┬──────────────┘             └───────┬────────────────┘                            │
│          │                                    │                                             │
│  ┌───────▼──────────────┐             ┌───────▼────────────────┐                            │
│  │ 3. Template          │◄────────────┤ 4. PDF Generation      │                            │
│  │    Service           │             │    Service             │                            │
│  └───────┬──────────────┘             └───────┬────────────────┘                            │
│          │                                    │                                             │
│          │                            ┌───────▼────────────────┐         ┌────────────────┐ │
│          │                            │ 5. Email Service       ├────────►│ SendGrid API   │ │
│          │                            └───────┬────────────────┘ (HTTPS) └────────────────┘ │
│          │                                    │                                             │
│          │                                    │                          ┌────────────────┐ │
│          │                                    └─────────────────────────►│ SMTP Fallback  │ │
│          │                                                       (SMTP)  └────────────────┘ │
└──────────┼──────────────────────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ MySQL Database                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Per-Service Deep Dive

### 3.1. API Gateway (Routing & Auth)
- **Responsibility:** Validates incoming JWTs against Clerk's public JWKS endpoints to establish stateless session identity and role-based access control.
- **Inputs / Outputs:** Input: `Bearer JWT`. Output: `Authentication` object injected into the Spring Security Context.
- **Upstream dependencies:** Clerk JWKS URI.
- **Downstream consumers:** All protected API Controllers.
- **Key design decision:** **Stateless JWT validation via JWKS** was chosen over a stateful session database or opaque tokens. *Trade-off:* We cannot instantly revoke a token without building a custom denylist, but we save a database round-trip on every single API request, which is critical for throughput.
- **Failure mode:** If the JWKS endpoint is unreachable, the application falls back to a locally cached JWKS. If the cache expires, the service returns `401 Unauthorized`, degrading securely rather than failing open.

### 3.2. Participant Service
- **Responsibility:** Parses uploaded `.xlsx` files using Apache POI, validates schema constraints, and manages the lifecycle state of participants in the database.
- **Inputs / Outputs:** Input: `MultipartFile (.xlsx)`. Output: Bulk `Participant` entities persisted in MySQL.
- **Upstream dependencies:** MySQL (for persistence).
- **Downstream consumers:** Bulk Orchestration Service (fetches pending users).
- **Key design decision:** **Batch inserting parsed entities** instead of one-by-one `save()`. *Trade-off:* Requires holding the entire parsed collection in JVM memory before the flush, increasing heap pressure, but drastically reduces database round-trips and transaction overhead.
- **Failure mode:** If parsing fails due to a malformed row, the entire transaction rolls back (all-or-nothing). No partial imports are committed.

### 3.3. Template Service
- **Responsibility:** Manages the storage and retrieval of raw PDF template byte arrays and associated coordinate calibration metadata (X/Y positioning, font size).
- **Inputs / Outputs:** Input: `PDF bytes`, coordinate metadata. Output: `CertificateTemplate` entity.
- **Upstream dependencies:** MySQL (for BLOB storage).
- **Downstream consumers:** PDF Generation Service.
- **Key design decision:** **Storing templates as `LONGBLOB` in MySQL** rather than using an external object store like AWS S3. *Trade-off:* Increases database size and backup time, but drastically simplifies deployment by removing an external infrastructure dependency, ensuring ACID consistency between the template file and its metadata.
- **Failure mode:** If the template exceeds the `max_allowed_packet` size, the database throws an exception, which propagates back as a `400 Bad Request` informing the user to compress the PDF.

### 3.4. PDF Generation Service
- **Responsibility:** Dynamically overlays participant text onto the base PDF template at calibrated coordinates using OpenPDF, yielding a flattened, in-memory PDF.
- **Inputs / Outputs:** Input: `Participant` data, `CertificateTemplate` entity. Output: `byte[]` (the generated PDF).
- **Upstream dependencies:** Template Service (provides the base template).
- **Downstream consumers:** Email Service (consumes the PDF bytes as an attachment).
- **Key design decision:** **In-memory PDF generation (`ByteArrayOutputStream`)** instead of writing to the local filesystem. *Trade-off:* Increases per-thread heap memory consumption, but eliminates disk I/O bottlenecks and avoids the complexity of cleaning up temporary files in a concurrent environment.
- **Failure mode:** If a specific PDF fails to generate (e.g., unsupported character in a font), an exception is caught, the participant is marked as `FAILED`, and the loop continues to the next participant.

### 3.5. Email Service
- **Responsibility:** Formats the email payload, attaches the generated PDF, and transmits it via the primary SendGrid API, seamlessly failing over to SMTP if necessary.
- **Inputs / Outputs:** Input: `byte[]` (PDF attachment), `Participant` email address. Output: Delivery success/failure boolean.
- **Upstream dependencies:** PDF Generation Service.
- **Downstream consumers:** Bulk Orchestration Service (uses the result to update DB status).
- **Key design decision:** **Primary REST API with a JavaMail SMTP fallback strategy.** *Trade-off:* Introduces slightly more complex retry logic and doubles dependency configuration, but provides extreme resilience against third-party outages or rate limits, which is paramount for bulk dispatch.
- **Failure mode:** If SendGrid fails (e.g., `429 Too Many Requests` or `500 Server Error`), the service immediately catches the exception and attempts transmission via the SMTP fallback. If both fail, it returns a negative boolean, allowing the Orchestrator to mark the user as `FAILED`.

### 3.6. Bulk Orchestration Service
- **Responsibility:** Coordinates the asynchronous execution of the entire certificate generation and dispatch pipeline while preventing concurrent job executions.
- **Inputs / Outputs:** Input: Trigger signal from Controller. Output: Immediate `202 Accepted` response.
- **Upstream dependencies:** Participant Service, PDF Generation Service, Email Service.
- **Downstream consumers:** The background ThreadPoolTaskExecutor.
- **Key design decision:** **Handling orchestration inside a background thread pool** rather than a distributed message queue (for now). *Trade-off:* If the JVM crashes mid-job, pending tasks are lost from memory. However, because status is tracked persistently in MySQL (`PENDING`), a restart allows the job to easily resume where it left off, avoiding the immediate complexity of managing a RabbitMQ broker.
- **Failure mode:** If the thread pool is exhausted, new job requests are rejected immediately. If the database connection drops during status updates, the orchestrator halts, logging the last successfully processed ID.

## 4. Sequence Diagrams

### a. Authentication Sequence
```text
1. Frontend -> Clerk: User authenticates via Google Auth.
2. Clerk -> Frontend: Returns JWT access token.
3. Frontend -> Frontend: Axios Interceptor attaches 'Authorization: Bearer <JWT>'.
4. Frontend -> API Gateway (Spring Security): HTTP GET /api/participants.
5. Spring Security -> Clerk JWKS Endpoint: Fetch public keys (if not cached).
6. Spring Security -> Spring Security: Verify JWT signature and expiration locally.
7. Spring Security -> API Controller: Access granted.
```

### b. Bulk Send Sequence
```text
1. Frontend -> Controller: POST /api/certificates/send-all.
2. Controller -> Orchestration Service: Acquire AtomicBoolean lock.
   [If lock == true: Return 409 Conflict (Job already running)]
3. Orchestration Service -> ThreadPoolTaskExecutor: Submit async worker job.
4. Controller -> Frontend: Return 202 Accepted (Immediately).
5. (Async Thread) Orchestration Service -> Participant Service: Fetch list WHERE status = 'PENDING'.
6. (Async Thread) [LOOP starts per participant]:
    7. Template Service -> DB: Load PDF byte array & coordinates.
    8. PDF Service -> Memory: Generate personalized PDF bytes.
    9. Email Service -> SendGrid: Transmit email with attachment.
   10. Orchestration Service -> DB: Update participant status = 'SENT'.
11. (Async Thread) [LOOP ends]: Release AtomicBoolean lock.
12. Frontend -> Controller: Polling GET /api/status -> Returns live progress.
```

### c. Failure & Fallback Sequence
```text
1. Email Service -> SendGrid API: POST /v3/mail/send.
2. SendGrid API -> Email Service: 429 Too Many Requests (Rate Limit).
3. Email Service -> Email Service: Catch RestClientException.
4. Email Service -> SMTP Fallback (JavaMailSender): Send via smtps://in-v3.mailjet.com.
5. [IF SMTP SUCCESS]:
    6a. Email Service -> Orchestration Service: Return TRUE.
    7a. Orchestration Service -> DB: UPDATE status = 'SENT'.
5. [IF SMTP FAILS (e.g., Timeout)]:
    6b. SMTP Fallback -> Email Service: Throw MailException.
    7b. Email Service -> Orchestration Service: Return FALSE.
    8b. Orchestration Service -> DB: UPDATE status = 'FAILED'.
```

## 5. Concurrency & State Management

### AtomicBoolean Lock Mechanics
The `AtomicBoolean` acts as a JVM-level mutex to prevent race conditions where multiple admins click "Send All" simultaneously. Mechanically, we call `lock.compareAndSet(false, true)`. This is a hardware-level atomic operation. If it returns `true`, the current thread successfully acquired the lock and proceeds. If it returns `false`, another job is already running, and we safely return an error. Without this, multiple async threads would fetch the same `PENDING` users simultaneously, generating and sending duplicate emails, leading to severe spam and API rate limit violations.

### ThreadPoolTaskExecutor & Async Processing
Bulk generation is CPU-bound (PDF generation) and I/O-bound (API/SMTP calls). Doing this synchronously on Tomcat's HTTP thread would result in a gateway timeout (`504 Gateway Timeout`) because the HTTP connection would remain open for minutes. 
By delegating to a `ThreadPoolTaskExecutor` (configured with a core pool size tailored to our CPU cores, e.g., `corePoolSize=4`, `maxPoolSize=10`), we immediately free the HTTP thread, ensuring a snappy UX. The pool size is intentionally bounded to prevent overwhelming the JVM heap with in-memory PDFs and to prevent database connection pool exhaustion.

### Consistent Status Tracking
While the background thread processes participants sequentially, it commits the state change (`UPDATE participant SET status = 'SENT'`) in short, individual transactions rather than one massive transaction at the end. This allows the frontend to poll a lightweight aggregate query (`SELECT status, COUNT(*) FROM participants GROUP BY status`) in real-time. Because the read queries use default `READ COMMITTED` isolation, they see the exact state of the job without locking the tables, providing a live progress bar to the user without data corruption.

## 6. Data Model Overview

| Entity | Key Fields | Relationships |
| :--- | :--- | :--- |
| **Participant** | `id` (PK), `email` (Unique), `name`, `status` (Enum: PENDING, SENT, FAILED) | None directly; operates independently for speed. |
| **CertificateTemplate** | `id` (PK), `fileData` (LONGBLOB), `nameX`, `nameY`, `eventY`, `fontSize` | Often 1-to-Many conceptually with participants (one active template per event). |

## 7. Scaling Path

As participant counts grow from 1,000 to 100,000, the monolithic architecture will encounter specific bottlenecks.

### What breaks first?
1. **SendGrid Rate Limits:** Before any internal system breaks, we will hit external API rate limits. The current loop processes synchronously per thread.
2. **Database Connection Pool Exhaustion / Lock Contention:** If we increase the `ThreadPoolTaskExecutor` size to parallelize processing, we will quickly consume all HikariCP database connections (default 10) during status updates.
3. **Heap Memory Exhaustion (OOM):** Storing hundreds of in-memory PDFs simultaneously if we scale worker threads too aggressively.

### First Extraction
The first service to be physically extracted to a microservice would be the **PDF Generation Service**. 
*Why:* PDF manipulation using OpenPDF is heavily CPU-bound. Email dispatch is heavily I/O-bound. By extracting PDF generation, we can scale the CPU-intensive instances horizontally across multiple Kubernetes pods without unnecessarily duplicating the I/O-bound orchestrator instances.

### Inserting a Message Queue
We would insert a message broker (e.g., RabbitMQ or Kafka) between the Orchestration Service and the Email Service.
*Problem solved:* Currently, if the JVM crashes midway through the async loop, the orchestrator dies, and memory state is lost. By pushing tasks to a queue (e.g., `email.dispatch.queue`), RabbitMQ durably persists the tasks. Async threads become queue consumers. If a worker dies, the message is unacknowledged and safely requeued to another worker, guaranteeing at-least-once delivery and smoothing out spikes in throughput without overwhelming external APIs.
