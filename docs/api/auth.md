# Authentication API contract

**Base URL:** `https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run`

This document contains only results recorded from probes of the deployed service. Each entry states the request used and the response observed. No behavior inferred from backend source code is included as an established contract.

## Probe method

The requests were sent to the deployed service using Postman. The probe set was:

- successful signup
- duplicate-email signup
- signup missing email
- signup missing name
- signup missing password
- signup invalid email format
- signup empty email
- signup short password
- signup six-character password
- signup seven-character password
- signup eight-character password
- signup nine-character password
- signup ten-character password
- successful login
- invalid-password login
- login missing email
- login missing password
- profile with a valid token
- profile without a token
- profile with a malformed token
- logout with a valid token
- logout without a token
- logout with a malformed token
- JWT expiry decode from the successful login response

The JSON probes used `Content-Type: application/json`. The authenticated probes used the literal header format `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

## POST `/auth/signup`

### Probe: successful signup

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "person@example.com",
  "name": "Example Person",
  "password": "xxxxxxxxx"
}
```

**Response observed:** `201 Created`

```json
{
  "message": "User added successfully",
  "user": {
    "UserID": 123,
    "FullName": "Example Person",
    "Email": "person@example.com"
  },
  "token": "<jwt>"
}
```

The example values represent the response shape recorded by the probe. The exact generated user ID and token vary per request.

**Validation rules observed:** the supplied email, name, and nine-character password were accepted and the account was created. Field aliases were not separately probed; the other signup validation cases are documented in the probes below.

### Probe: duplicate email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the same email as an existing account, and the signup body above.

**Response observed:** `400 Bad Request`

```json
{
  "message": "User already exists"
}
```

**Validation rule observed:** an already registered email is rejected with `400 Bad Request`. Field aliases were not separately probed; other validation cases are documented in the probes below.

### Probe: missing email

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "name": "Probe User",
  "password": "probe-password"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `email` is rejected with `500 Internal Server Error`.

### Probe: missing name

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "probe-invalid@example.com",
  "password": "probe-password"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `name` is rejected with `500 Internal Server Error`.

### Probe: missing password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "probe-invalid@example.com",
  "name": "Probe User"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `password` is rejected with `500 Internal Server Error`.

### Probe: short password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and a five-character password:

```json
{
  "email": "probe-invalid@example.com",
  "name": "Probe User",
  "password": "12345"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** a five-character password is rejected with `500 Internal Server Error`.

### Probe: six-character password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and a six-character password:

```json
{
  "email": "probe-six@example.com",
  "name": "Probe User",
  "password": "123456"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** a six-character password was not accepted by this probe. The response does not establish whether six characters is below the minimum or whether another signup failure caused the `500` response.

### Probe: seven-character password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and a seven-character password:

```json
{
  "email": "probe-seven@example.com",
  "name": "Probe User",
  "password": "xxxxxxx"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** a seven-character password was not accepted by this probe. The response does not establish whether seven characters is below the minimum or whether another signup failure caused the `500` response.

### Probe: eight-character password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and an eight-character password:

```json
{
  "email": "probe-eight@example.com",
  "name": "Probe User",
  "password": "xxxxxxxx"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** an eight-character password was not accepted by this probe. The response does not establish whether eight characters is below the minimum or whether another signup failure caused the `500` response.

### Probe: nine-character password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and a nine-character password:

```json
{
  "email": "probe-boundary-9-973798262@example.com",
  "name": "Probe User",
  "password": "xxxxxxxxx"
}
```

**Response observed:** `201 Created`

```json
{
  "message": "User added successfully",
  "user": {
    "UserID": 11,
    "FullName": "Probe User",
    "Email": "probe-boundary-9-973798262@example.com"
  },
  "token": "<jwt>"
}
```

**Validation rule observed:** a nine-character password was accepted by this probe.

### Probe: ten-character password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and a ten-character password:

```json
{
  "email": "probe-boundary-10-unique@example.com",
  "name": "Probe User",
  "password": "xxxxxxxxxx"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** a ten-character password was not accepted by this probe.

### Probe: invalid email format

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and an email without an email-format delimiter:

```json
{
  "email": "not-an-email",
  "name": "Probe User",
  "password": "probe-password"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** an invalid-format email was not accepted by this probe. The response does not establish whether email format caused the `500` response or whether another signup failure caused it.

### Probe: empty email

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and an empty email:

```json
{
  "email": "",
  "name": "Probe User",
  "password": "probe-password"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** an empty email was rejected with `500 Internal Server Error`.

## POST `/auth/login`

### Probe: successful login

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "person@example.com",
  "password": "at-least-6-chars"
}
```

**Response observed:** `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "UserID": 123,
    "FullName": "Example Person",
    "Email": "person@example.com",
    "created_at": "2026-09-15T12:00:00.000Z"
  },
  "token": "<jwt>"
}
```

The example values represent the response shape recorded by the probe. The exact user ID, timestamp, and token vary per request.

**Validation rules observed:** the supplied email and password were accepted. Email format and field aliases were not separately probed; missing-email and missing-password behavior are documented in the validation probes below.

### Probe: token expiry

**Observation:** the JWT returned by the successful login probe was decoded locally. The `iat` and `exp` claims differed by 7 days.

**Result observed:** the token expiry for this login response was 7 days.

### Probe: invalid password

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a valid email, and an incorrect password.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Invalid credentials"
}
```

**Validation rule observed:** an incorrect password is rejected with `401 Unauthorized`. The response for an unknown email was not separately probed.

### Probe: missing password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "probe-invalid@example.com"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `password` is rejected with `500 Internal Server Error`.

### Probe: missing email

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "password": "probe-password"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `email` is rejected with `500 Internal Server Error`.

## GET `/auth/profile`

### Probe: valid token

**Request:** `GET` with the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe. No request body or `Content-Type` header was used.

**Response observed:** `200 OK`

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "UserID": 123,
    "FullName": "Example Person",
    "Email": "person@example.com",
    "created_at": "2026-09-15T12:00:00.000Z"
  }
}
```

**Validation rule observed:** the token supplied as `Authorization: Bearer <jwt>` was accepted. Expired-token handling was not separately probed. The malformed-token result is documented under **Probe: malformed token** below, and the seven-day expiry observation is documented under the login probe.

### Probe: missing token

**Request:** `GET` without an `Authorization` header, without a request body, and without a `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation rule observed:** omitting the `Authorization` header is rejected with `401 Unauthorized`.

### Probe: malformed token

**Request:** `GET` with the literal header `Authorization: Bearer not-a-jwt`. No request body or `Content-Type` header was used.

**Response observed:** `403 Forbidden`

```json
{
  "message": "Access denied. Invalid token."
}
```

**Validation rule observed:** a malformed bearer token is rejected with `403 Forbidden`.

## POST `/auth/logout`

### Probe: valid token

**Request:** `POST` with the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe. No request body or `Content-Type` header was used.

**Response observed:** `200 OK`

```json
{
  "status": "success",
  "message": "Logout successful. Please delete the token from your client storage."
}
```

**Validation rule observed:** the token supplied as `Authorization: Bearer <jwt>` was accepted. Whether logout revokes the token server-side was not probed.

### Probe: missing token

**Request:** `POST` without an `Authorization` header, without a request body, and without a `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation rule observed:** omitting the `Authorization` header is rejected with `401 Unauthorized`.

### Probe: malformed token

**Request:** `POST` with the literal header `Authorization: Bearer not-a-jwt`. No request body or `Content-Type` header was used.

**Response observed:** `403 Forbidden`

```json
{
  "message": "Access denied. Invalid token."
}
```

**Validation rule observed:** a malformed bearer token is rejected with `403 Forbidden`.

## Not established by these probes

The probe record does not establish the following details, so they are intentionally not claimed here:

- signup field aliases and the cause of the generic `500` responses for invalid-format email and password lengths other than the accepted nine-character probe
- an exact password minimum; the probes establish that nine characters was accepted, while five through eight and ten through fifteen returned `500`
- JWT claims other than the observed seven-day difference between `iat` and `exp`
- whether logout revokes the token server-side
- behavior for expired tokens
- profile behavior when the token refers to a deleted user
- unhandled database errors

`POST /auth/forgot-password` and `POST /auth/reset-password` are unverified and are not included in this contract.