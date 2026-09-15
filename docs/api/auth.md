# Authentication API contract

**Base URL:** `https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run`

This document contains only results recorded from probes of the deployed service. Each entry states the request used and the response observed. No behavior inferred from backend source code is included as an established contract.

## Probe method

The requests were sent to the deployed service using Postman. The probe set was:

- successful signup
- duplicate-email signup
- successful login
- invalid-password login
- profile with a valid token
- profile without a token
- logout with a valid token
- logout without a token

The JSON probes used `Content-Type: application/json`. The authenticated probes used an `Authorization` header containing the token returned by the successful login probe. The exact accepted token prefix was not separately probed.

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

**Validation observed:** the supplied signup data was accepted and created an account. Required-field, password-length, email-format, and field-alias validation were not separately probed.

### Probe: duplicate email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the same email as an existing account, and the signup body above.

**Response observed:** `400 Bad Request`

```json
{
  "message": "User already exists"
}
```

**Validation observed:** an already registered email is rejected with `400 Bad Request`. Other signup validation rules were not established by this probe.

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

**Validation observed:** the supplied email and password were accepted. Required-field, password-length, email-format, and field-alias validation were not separately probed.

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

**Validation observed:** an incorrect password is rejected with `401 Unauthorized`. The response for an unknown email was not separately probed.

## GET `/auth/profile`

### Probe: valid token

**Request:** `GET` with an `Authorization` header containing the token returned by the successful login probe. No request body or `Content-Type` header was used.

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

**Validation observed:** the token from the successful login probe was accepted. Token expiry, malformed-token handling, and token-prefix requirements were not separately probed.

### Probe: missing token

**Request:** `GET` without an `Authorization` header, without a request body, and without a `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation observed:** omitting the `Authorization` header is rejected with `401 Unauthorized`.

## POST `/auth/logout`

### Probe: valid token

**Request:** `POST` with an `Authorization` header containing the token returned by the successful login probe. No request body or `Content-Type` header was used.

**Response observed:** `200 OK`

```json
{
  "status": "success",
  "message": "Logout successful. Please delete the token from your client storage."
}
```

**Validation observed:** the token from the successful login probe was accepted. Whether logout revokes the token server-side was not probed.

### Probe: missing token

**Request:** `POST` without an `Authorization` header, without a request body, and without a `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation observed:** omitting the `Authorization` header is rejected with `401 Unauthorized`.

## Not established by these probes

The probe record does not establish the following details, so they are intentionally not claimed here:

- signup field aliases, required-field validation, password-length validation, or email-format validation
- the exact token expiry or JWT claims
- whether the token must use the `Bearer` prefix or may be sent raw
- whether logout revokes the token server-side
- behavior for expired or malformed tokens
- profile behavior when the token refers to a deleted user
- unhandled database errors

`POST /auth/forgot-password` and `POST /auth/reset-password` are unverified and are not included in this contract.