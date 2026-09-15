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
- signup short password
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

The JSON probes used `Content-Type: application/json`. The authenticated probes used the literal header format `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

## POST `/auth/signup`

### Probe: successful signup

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "person@example.com",
  "name": "Example Person",
  "password": "at-least-6-chars"
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

**Validation rules observed:** the supplied email, name, and password were accepted and the account was created. Email format and field aliases were not separately probed; the other signup validation cases are documented in the probes below.

### Probe: duplicate email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the same email as an existing account, and the signup body above.

**Response observed:** `400 Bad Request`

```json
{
  "message": "User already exists"
}
```

**Validation rule observed:** an already registered email is rejected with `400 Bad Request`. Email format and field aliases were not separately probed; other validation cases are documented in the probes below.

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

**Validation rule observed:** the token supplied as `Authorization: Bearer <jwt>` was accepted. Expired-token and malformed-token handling were not separately probed. The seven-day expiry observation is documented under the login probe.

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

- signup field aliases and email-format validation
- JWT claims other than the observed seven-day difference between `iat` and `exp`
- whether logout revokes the token server-side
- behavior for expired tokens
- profile behavior when the token refers to a deleted user
- unhandled database errors

`POST /auth/forgot-password` and `POST /auth/reset-password` are unverified and are not included in this contract.