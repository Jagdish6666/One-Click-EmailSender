# One-Click-EmailSender: Detailed Project Workflow

This document explains the complete, end-to-end working flow of the One-Click-EmailSender project. It details exactly how data moves through the microservices from the moment a user clicks "Send" on the frontend to the moment the final email arrives in a participant's inbox.

---

## 1. System Architecture Overview

The project is built using a **Microservices Architecture** with the following components:

- **Frontend:** Next.js (React) + TailwindCSS
- **API Gateway (Port 8080):** The entry point. Handles routing, user registration, login, password hashing (BCrypt), and JWT Token generation & validation.
- **Participant Service (Port 8083):** Parses Excel files (Apache POI) and manages participant records in the MySQL database.
- **Certificate Service (Port 8084):** Generates personalized PDFs (OpenPDF) and pushes tasks to RabbitMQ.
- **Notification Service (Port 8085):** Listens to RabbitMQ, sends emails (SendGrid API), and updates participant status.
- **Infrastructure:** MySQL (Database) & RabbitMQ (Message Broker).

---

## 2. Detailed Working Flow: Step-by-Step

### Phase 1: Authentication & Setup
1. **Login:** The Admin User logs into the frontend. The credentials are sent to the **API Gateway**. The Gateway checks MySQL directly, verifies the password, and returns a signed JWT Token.
2. **Frontend Storage:** The Next.js frontend saves this JWT token in LocalStorage and attaches it as a `Bearer` token to the `Authorization` header of all future API requests.
3. **Template Upload:** The Admin uploads a blank PDF certificate template. The **API Gateway** intercepts the request, validates the JWT token, and routes it to the **Certificate Service**, which saves the template in the database as a `LONGBLOB`.
4. **Participant Upload:** The Admin uploads an Excel file (.xlsx) containing participant names and emails. The Gateway routes this to the **Participant Service**, which reads the rows and saves them into the MySQL database with a default status of `PENDING`.

### Phase 2: Triggering the Bulk Send
5. **The Trigger:** The Admin clicks the "Send All Pending" button on the frontend dashboard.
6. **Gateway Validation:** The HTTP request hits the **API Gateway**. The Gateway's internal filter checks the JWT signature. It confirms the request is secure and forwards the command to the **Certificate Service**.
7. **Fetching Participants:** The **Certificate Service** needs to know who to send emails to. It makes an internal HTTP REST call to the **Participant Service** requesting all participants whose status is `PENDING`. The Participant Service responds with a JSON list of users.

### Phase 3: Document Generation & Asynchronous Queuing (RabbitMQ)
8. **PDF Generation:** For every single participant in the list, the **Certificate Service** pulls the active PDF template from the database. It uses the `OpenPDF` library to dynamically draw the participant's exact name and event details onto the PDF, generating a byte array (the file data).
9. **Message Creation:** The **Certificate Service** creates a `CertificateEvent` object. This object contains the participant's ID, Name, Email, and the generated PDF byte array.
10. **Publishing to RabbitMQ:** Instead of sending the emails directly (which would freeze the server if there are thousands of users), the **Certificate Service** publishes the `CertificateEvent` to the `certificate.send.exchange` in **RabbitMQ** with the routing key `certificate.send.key`. 
11. **Immediate Response:** Because RabbitMQ accepts the messages instantly, the **Certificate Service** immediately sends a `200 OK` response back to the Frontend. The Admin sees a success message on the screen without waiting for the emails to actually send.

### Phase 4: Consumption & Email Delivery
12. **The Consumer:** The **Notification Service** operates in the background, constantly listening to the `certificate.send.queue` in RabbitMQ.
13. **Processing the Event:** As soon as an event enters the queue, the **Notification Service** pulls it out. It reads the email address and extracts the PDF byte array.
14. **SendGrid Integration:** It constructs an email message, attaches the PDF file, and makes an API call to **SendGrid** to deliver the email.
15. **Status Update (Success/Fail):** 
    - If SendGrid returns a success code (e.g., 202 Accepted), the Notification Service makes an internal REST call to the **Participant Service** to update that user's status from `PENDING` to `SENT`.
    - If SendGrid fails (e.g., network error or bad email), it updates the status to `FAILED`. It also sends a NACK (Negative Acknowledge) to RabbitMQ, meaning the message can be retried or moved to a Dead Letter Queue (DLQ) so the system never loses track of a failed email.

---

## Summary for Technical Interviews
If you are asked to summarize this in an interview, focus on **Asynchronous Processing**.

*"The most critical part of this workflow is the decoupling of the heavy lifting. The Certificate Service only generates PDFs and pushes them to RabbitMQ. It does NOT send emails. The Notification Service only consumes from RabbitMQ and sends emails. Because they communicate through a message broker asynchronously, the system can handle 10,000 certificates without blocking the user interface or crashing the API Gateway with long HTTP timeouts."*
