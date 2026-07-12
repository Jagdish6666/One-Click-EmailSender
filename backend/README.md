# Single-Click Certificate Email Sender System

A production-ready backend system built using Java 17 and Spring Boot that generates PDF certificates and sends them via email to event participants using SendGrid.

## Features
- **Spring Security & Google OAuth2**: Secure APIs with restricted access.
- **JWT token generation** upon successful Google OAuth2 login for stateless API authentication.
- **Bulk PDF Certificate Generation** using OpenPDF.
- **Asynchronous Bulk Emails** via SendGrid.
- **MySQL Integration** with JPA entities tracking Participant status (`PENDING`, `SENT`, `FAILED`).

## Prerequisites
- Java 17+
- Maven 3.8+
- MySQL Server running locally on port `3306`

## Environment Setup
1. Rename `.env.example` to `.env` or just export the environment variables it contains. (Alternatively, you can provide these variables to your system environment when starting the application).
2. Inside `application.properties`, these variables are loaded via standard Spring `bash-style` injection format `${ENV_VAR_NAME}`.

**Required SendGrid keys**: `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`. You must create a verified Sender Identity in your SendGrid dashboard.
**Required Google OAuth keys**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` generated from the Google Cloud Console. Enable the "Google+ API" and "Google OAuth2 API", set Redirect URI to `http://localhost:8080/login/oauth2/code/google`.

## How to Run
```bash
# Build the project
mvn clean install

# Run the project
mvn spring-boot:run
```

## API Documentation

### 1. OAuth2 Login flow
- **URL**: `GET http://localhost:8080/oauth2/authorization/google`
- Initiates the Google login flow. Upon success, you will receive a JWT token in JSON format as a response (for demonstration). You will use this token for subsequent requests.

### 2. Add Participant
- **URL**: `POST /api/participants`
- **Headers**:
  - `Authorization: Bearer <your_jwt_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
      "name": "John Doe",
      "email": "johndoe@example.com",
      "eventName": "Spring Boot Hackathon 2026"
  }
  ```

### 3. Get Participants (Filter Supported)
- **URL**: `GET /api/participants?status=PENDING`
- **Headers**: `Authorization: Bearer <your_jwt_token>`

### 4. Send Bulk Certificates (ADMIN only)
- **URL**: `POST /api/certificates/send`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Response**: Triggers the asynchronous background generation of PDFs and emails to all participants in `PENDING` status. Updates their status efficiently in the database.

## System Architecture Highlights
* **Clean Architecture**: `controller` -> `service` -> `repository` -> `entity`.
* **Exceptions**: Custom `GlobalExceptionHandler` intercepts unchecked exceptions to respond with standardised uniform `ApiResponse`.
* **Database Design**: `PrePersist` hooks are used to auto-generate UUIDs for certificate IDs.
* **OpenPDF Generation**: Completely programmatic layout with headers, details, and exact timestamp.
