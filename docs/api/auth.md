# Authentication API contract

**Base URL:** `https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run`

This document contains only results recorded from probes of the deployed service. Each entry states the request used and the response observed. No behavior inferred from backend source code is included as an established contract.

## Probe method

Requests were sent to the deployed service using Postman, except the password-length sweep, which was sent with `scripts/probe-password-boundary.sh` so that a single variable could be isolated across many attempts.

JSON probes used `Content-Type: application/json`. Authenticated probes used the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

Every negative probe uses a freshly generated, previously unregistered email of the fixed shape `probe-<run-id>-<n>@example.com`. This is deliberate: a reused email would cause a duplicate-account failure that could be mistaken for a field-validation failure. Any entry below that does not state a fresh email was used should be treated as unverified.

### Superseded results

An earlier revision of this document recorded a fifteen-character signup password as the only accepted length, and a later revision recorded nine characters as accepted and ten as rejected, implying a boundary somewhere in between. Neither was produced with repeated attempts, so neither could distinguish a real validation rule from an intermittent server failure. The determinism probe recorded under [Probe: signup determinism](#probe-signup-determinism-password-length-is-not-established) shows that repeated, otherwise-identical signup requests do not reliably produce the same status, which means both earlier results are as consistent with chance as with a length rule. They are noted here rather than deleted so a reader can tell which observation describes the service today, and neither should be treated as an established boundary.

## Token

Consolidated for the reader; each claim is recorded by the probe named beside it.

| Question | Observed | Probe |
|---|---|---|
| Where is the token returned? | Top-level `token` field of the `201` signup response and the `200` login response | successful signup, successful login |
| Where does the API expect it? | Request header, literal format `Authorization: Bearer <jwt>` | profile valid token, logout valid token |
| Is it accepted anywhere else? | Not probed. No cookie or query-parameter delivery was tested. | — |
| Expiry | 7 days. The JWT from the successful login response was decoded locally; `iat` and `exp` differed by 7 days. | token expiry |
| Other claims | Not established. No claim other than the `iat`/`exp` difference was read. | — |
| Server-side revocation on logout | Not probed. | — |
| Behavior of an expired token | Not probed. | — |

---

## POST `/auth/signup`

**Method and path:** `POST /auth/signup`
**Headers:** `Content-Type: application/json`. No authentication.

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

**Validation rule observed:** the supplied email, name, and password were accepted and the account was created.

### Probe: duplicate email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the email of an account created by an earlier probe, and an otherwise valid signup body.

**Response observed:** `400 Bad Request`

```json
{
  "message": "User already exists"
}
```

**Validation rule observed:** an already registered email is rejected with `400 Bad Request` and this body. This is the one error path whose response body is recorded from a real rejection rather than a generic failure.

### Probe: signup determinism (password length is not established)

**Request:** six unauthenticated `POST` requests to `/auth/signup` with header `Content-Type: application/json`. `name` (`"Probe User"`) and `password` (`"Probe1234"`, 9 characters) were held identical on every request; only `email` varied, using a fresh, previously unregistered address per request (`probe-ctrl-01@example.com` through `probe-ctrl-06@example.com`) so that a duplicate-account rejection could not be mistaken for any other kind of failure.

**Responses observed:**

| Run | Email | Status |
|---|---|---|
| 1 | probe-ctrl-01@example.com | `201 Created` |
| 2 | probe-ctrl-02@example.com | `500 Internal Server Error` |
| 3 | probe-ctrl-03@example.com | `500 Internal Server Error` |
| 4 | probe-ctrl-04@example.com | `500 Internal Server Error` |
| 5 | probe-ctrl-05@example.com | `500 Internal Server Error` |
| 6 | probe-ctrl-06@example.com | `500 Internal Server Error` |

Every `500` returned the same generic body, `{"message": "Internal server error"}`; the one `201` returned the standard success shape documented above under **Probe: successful signup**.

**Validation rule observed:** none. Six requests with identical `name` and `password` and no field that should legitimately affect the outcome (each `email` was fresh and unregistered) produced five failures and one success. Because the only controlled variable behaves the same way across all six requests, the differing outcomes cannot be attributed to any field in the request, including password length. **Signup responses from this endpoint are non-deterministic.**

This supersedes every password-length claim recorded in earlier revisions of this document, including the boundary implied by the original 9-character (accepted) and 10-character (rejected) probes: those two results are equally consistent with a real length rule and with the same failure pattern seen here. No password-length minimum, maximum, or boundary is established by any probe in this document.

**Consequence for the signup screen:** the client cannot derive a password-length validation rule from this contract, and should not guess one. The generic `500` response also does not distinguish a rejected password from an unrelated server failure — see [Not established by these probes](#not-established-by-these-probes).

**Recommendation:** this behavior should be filed and tracked as a backend defect, separate from this documentation task, since it affects signup reliability generally and not only password validation.

### Probe: missing email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a fresh unregistered email omitted entirely, and this JSON body:

```json
{
  "name": "Probe User",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `email` is rejected. The response is a generic `500` with no field-specific reason, so the doc records the rejection but not a reason supplied by the service.

### Probe: missing name

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a fresh unregistered email, and `name` omitted:

```json
{
  "email": "probe-<run-id>-<n>@example.com",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `name` is rejected, with a generic `500` and no field-specific reason.

### Probe: missing password

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a fresh unregistered email, and `password` omitted:

```json
{
  "email": "probe-<run-id>-<n>@example.com",
  "name": "Probe User"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `password` is rejected, with a generic `500` and no field-specific reason.

### Probe: empty email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, an empty `email`, and a password of an accepted length:

```json
{
  "email": "",
  "name": "Probe User",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** an empty `email` is rejected, with a generic `500` and no field-specific reason.

### Probe: invalid email format

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, an `email` with no `@` delimiter, and a password of an accepted length:

```json
{
  "email": "not-an-email",
  "name": "Probe User",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** this value was rejected. Because the response is a generic `500` and no format variants were swept, the probe does not establish which part of the value was rejected or what the service accepts as a valid format. A client cannot derive an email format rule from this contract.

### Signup field aliases

Not probed. Only the literal field names `email`, `name` and `password` were sent. Whether the service accepts alternatives such as `fullName` is unknown.

---

## POST `/auth/login`

**Method and path:** `POST /auth/login`
**Headers:** `Content-Type: application/json`. No authentication.

### Probe: successful login

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "person@example.com",
  "password": "<the password used at signup>"
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

The example values represent the response shape recorded by the probe. The exact user ID, timestamp and token vary per request.

**Validation rule observed:** the credentials of an account created by the successful signup probe were accepted.

### Probe: token expiry

**Observation:** the JWT returned by the successful login probe was decoded locally. The `iat` and `exp` claims differed by 7 days.

**Result observed:** the token expiry for this login response was 7 days. No other claim was read, and no expired token was exercised against a protected route.

### Probe: invalid password

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the email of an existing account, and an incorrect password.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Invalid credentials"
}
```

**Validation rule observed:** an incorrect password is rejected with `401 Unauthorized` and this body.

### Probe: unknown email

Not probed. Whether an unregistered email returns the same `401` body or a different response is unknown.

### Probe: missing password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "probe-<run-id>-<n>@example.com"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `password` is rejected, with a generic `500` and no field-specific reason.

### Probe: missing email

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `email` is rejected, with a generic `500` and no field-specific reason.

---

## GET `/auth/profile`

**Method and path:** `GET /auth/profile`
**Headers:** `Authorization: Bearer <jwt>`. No request body and no `Content-Type` header were sent.

### Probe: valid token

**Request:** `GET` with the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

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

**Validation rule observed:** a token supplied as `Authorization: Bearer <jwt>` is accepted and the profile of the token's owner is returned.

### Probe: missing token

**Request:** `GET` with no `Authorization` header, no request body and no `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation rule observed:** omitting the `Authorization` header is rejected with `401 Unauthorized` and this body.

### Probe: malformed token

**Request:** `GET` with the literal header `Authorization: Bearer not-a-jwt`.

**Response observed:** `403 Forbidden`

```json
{
  "message": "Access denied. Invalid token."
}
```

**Validation rule observed:** a malformed bearer token is rejected with `403 Forbidden` and this body. Note that a missing token and an invalid token return different statuses, `401` and `403` respectively.

---

## POST `/auth/logout`

**Method and path:** `POST /auth/logout`
**Headers:** `Authorization: Bearer <jwt>`. No request body and no `Content-Type` header were sent.

### Probe: valid token

**Request:** `POST` with the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

**Response observed:** `200 OK`

```json
{
  "status": "success",
  "message": "Logout successful. Please delete the token from your client storage."
}
```

Note that this response uses a `status` field, which the other endpoints probed here do not.

**Validation rule observed:** a token supplied as `Authorization: Bearer <jwt>` is accepted. Whether logout revokes the token server-side was not probed; the same token was not re-sent to a protected route afterwards.

### Probe: missing token

**Request:** `POST` with no `Authorization` header, no request body and no `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation rule observed:** omitting the `Authorization` header is rejected with `401 Unauthorized` and this body.

### Probe: malformed token

**Request:** `POST` with the literal header `Authorization: Bearer not-a-jwt`.

**Response observed:** `403 Forbidden`

```json
{
  "message": "Access denied. Invalid token."
}
```

**Validation rule observed:** a malformed bearer token is rejected with `403 Forbidden` and this body.

---

## Unverified routes

`POST /auth/forgot-password` and `POST /auth/reset-password` are **unverified**. They were not probed. This document makes no claim that they exist, that they work, or what their request or response shapes are. Do not build against them until they are probed and recorded here.

---

## Not established by these probes

These details are not claimed, because no recorded probe establishes them:

- signup field aliases; only `email`, `name` and `password` were sent
- what the service accepts as a valid email format, and which part of `not-an-email` was rejected
- the reason behind any `500 Internal Server Error`; the body is generic and identifies no field
- any password length rule; six requests with an identical, otherwise-valid body returned five `500`s and one `201`, so the service is non-deterministic and no length-based cause can be assigned to any prior `500`, including the original 10-character probe
- whether a signup or login `500` indicates rejected input, non-deterministic failure, or an unrelated server fault — these are no longer separable given the determinism finding
- JWT claims other than the observed seven-day difference between `iat` and `exp`
- whether logout revokes the token server-side
- behavior for expired tokens
- the login response for an unregistered email
- profile behavior when the token refers to a deleted user# Authentication API contract

**Base URL:** `https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run`

This document contains only results recorded from probes of the deployed service. Each entry states the request used and the response observed. No behavior inferred from backend source code is included as an established contract.

## Probe method

Requests were sent to the deployed service using Postman, except the password-length sweep, which was sent with `scripts/probe-password-boundary.sh` so that a single variable could be isolated across many attempts.

JSON probes used `Content-Type: application/json`. Authenticated probes used the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

Every negative probe uses a freshly generated, previously unregistered email of the fixed shape `probe-<run-id>-<n>@example.com`. This is deliberate: a reused email would cause a duplicate-account failure that could be mistaken for a field-validation failure. Any entry below that does not state a fresh email was used should be treated as unverified.

### Superseded results

An earlier revision of this document recorded a fifteen-character signup password as the only accepted length, and a later revision recorded nine characters as accepted and ten as rejected, implying a boundary somewhere in between. Neither was produced with repeated attempts, so neither could distinguish a real validation rule from an intermittent server failure. The determinism probe recorded under [Probe: signup determinism](#probe-signup-determinism-password-length-is-not-established) shows that repeated, otherwise-identical signup requests do not reliably produce the same status, which means both earlier results are as consistent with chance as with a length rule. They are noted here rather than deleted so a reader can tell which observation describes the service today, and neither should be treated as an established boundary.

## Token

Consolidated for the reader; each claim is recorded by the probe named beside it.

| Question | Observed | Probe |
|---|---|---|
| Where is the token returned? | Top-level `token` field of the `201` signup response and the `200` login response | successful signup, successful login |
| Where does the API expect it? | Request header, literal format `Authorization: Bearer <jwt>` | profile valid token, logout valid token |
| Is it accepted anywhere else? | Not probed. No cookie or query-parameter delivery was tested. | — |
| Expiry | 7 days. The JWT from the successful login response was decoded locally; `iat` and `exp` differed by 7 days. | token expiry |
| Other claims | Not established. No claim other than the `iat`/`exp` difference was read. | — |
| Server-side revocation on logout | Not probed. | — |
| Behavior of an expired token | Not probed. | — |

---

## POST `/auth/signup`

**Method and path:** `POST /auth/signup`
**Headers:** `Content-Type: application/json`. No authentication.

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

**Validation rule observed:** the supplied email, name, and password were accepted and the account was created.

### Probe: duplicate email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the email of an account created by an earlier probe, and an otherwise valid signup body.

**Response observed:** `400 Bad Request`

```json
{
  "message": "User already exists"
}
```

**Validation rule observed:** an already registered email is rejected with `400 Bad Request` and this body. This is the one error path whose response body is recorded from a real rejection rather than a generic failure.

### Probe: signup determinism (password length is not established)

**Request:** six unauthenticated `POST` requests to `/auth/signup` with header `Content-Type: application/json`. `name` (`"Probe User"`) and `password` (`"Probe1234"`, 9 characters) were held identical on every request; only `email` varied, using a fresh, previously unregistered address per request (`probe-ctrl-01@example.com` through `probe-ctrl-06@example.com`) so that a duplicate-account rejection could not be mistaken for any other kind of failure.

**Responses observed:**

| Run | Email | Status |
|---|---|---|
| 1 | probe-ctrl-01@example.com | `201 Created` |
| 2 | probe-ctrl-02@example.com | `500 Internal Server Error` |
| 3 | probe-ctrl-03@example.com | `500 Internal Server Error` |
| 4 | probe-ctrl-04@example.com | `500 Internal Server Error` |
| 5 | probe-ctrl-05@example.com | `500 Internal Server Error` |
| 6 | probe-ctrl-06@example.com | `500 Internal Server Error` |

Every `500` returned the same generic body, `{"message": "Internal server error"}`; the one `201` returned the standard success shape documented above under **Probe: successful signup**.

**Validation rule observed:** none. Six requests with identical `name` and `password` and no field that should legitimately affect the outcome (each `email` was fresh and unregistered) produced five failures and one success. Because the only controlled variable behaves the same way across all six requests, the differing outcomes cannot be attributed to any field in the request, including password length. **Signup responses from this endpoint are non-deterministic.**

This supersedes every password-length claim recorded in earlier revisions of this document, including the boundary implied by the original 9-character (accepted) and 10-character (rejected) probes: those two results are equally consistent with a real length rule and with the same failure pattern seen here. No password-length minimum, maximum, or boundary is established by any probe in this document.

**Consequence for the signup screen:** the client cannot derive a password-length validation rule from this contract, and should not guess one. The generic `500` response also does not distinguish a rejected password from an unrelated server failure — see [Not established by these probes](#not-established-by-these-probes).

**Recommendation:** this behavior should be filed and tracked as a backend defect, separate from this documentation task, since it affects signup reliability generally and not only password validation.

### Probe: missing email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a fresh unregistered email omitted entirely, and this JSON body:

```json
{
  "name": "Probe User",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `email` is rejected. The response is a generic `500` with no field-specific reason, so the doc records the rejection but not a reason supplied by the service.

### Probe: missing name

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a fresh unregistered email, and `name` omitted:

```json
{
  "email": "probe-<run-id>-<n>@example.com",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `name` is rejected, with a generic `500` and no field-specific reason.

### Probe: missing password

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, a fresh unregistered email, and `password` omitted:

```json
{
  "email": "probe-<run-id>-<n>@example.com",
  "name": "Probe User"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `password` is rejected, with a generic `500` and no field-specific reason.

### Probe: empty email

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, an empty `email`, and a password of an accepted length:

```json
{
  "email": "",
  "name": "Probe User",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** an empty `email` is rejected, with a generic `500` and no field-specific reason.

### Probe: invalid email format

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, an `email` with no `@` delimiter, and a password of an accepted length:

```json
{
  "email": "not-an-email",
  "name": "Probe User",
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** this value was rejected. Because the response is a generic `500` and no format variants were swept, the probe does not establish which part of the value was rejected or what the service accepts as a valid format. A client cannot derive an email format rule from this contract.

### Signup field aliases

Not probed. Only the literal field names `email`, `name` and `password` were sent. Whether the service accepts alternatives such as `fullName` is unknown.

---

## POST `/auth/login`

**Method and path:** `POST /auth/login`
**Headers:** `Content-Type: application/json`. No authentication.

### Probe: successful login

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "person@example.com",
  "password": "<the password used at signup>"
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

The example values represent the response shape recorded by the probe. The exact user ID, timestamp and token vary per request.

**Validation rule observed:** the credentials of an account created by the successful signup probe were accepted.

### Probe: token expiry

**Observation:** the JWT returned by the successful login probe was decoded locally. The `iat` and `exp` claims differed by 7 days.

**Result observed:** the token expiry for this login response was 7 days. No other claim was read, and no expired token was exercised against a protected route.

### Probe: invalid password

**Request:** unauthenticated `POST` with header `Content-Type: application/json`, the email of an existing account, and an incorrect password.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Invalid credentials"
}
```

**Validation rule observed:** an incorrect password is rejected with `401 Unauthorized` and this body.

### Probe: unknown email

Not probed. Whether an unregistered email returns the same `401` body or a different response is unknown.

### Probe: missing password

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "email": "probe-<run-id>-<n>@example.com"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `password` is rejected, with a generic `500` and no field-specific reason.

### Probe: missing email

**Request:** unauthenticated `POST` with header `Content-Type: application/json` and this JSON body:

```json
{
  "password": "<accepted length>"
}
```

**Response observed:** `500 Internal Server Error`

```json
{
  "message": "Internal server error"
}
```

**Validation rule observed:** omitting `email` is rejected, with a generic `500` and no field-specific reason.

---

## GET `/auth/profile`

**Method and path:** `GET /auth/profile`
**Headers:** `Authorization: Bearer <jwt>`. No request body and no `Content-Type` header were sent.

### Probe: valid token

**Request:** `GET` with the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

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

**Validation rule observed:** a token supplied as `Authorization: Bearer <jwt>` is accepted and the profile of the token's owner is returned.

### Probe: missing token

**Request:** `GET` with no `Authorization` header, no request body and no `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation rule observed:** omitting the `Authorization` header is rejected with `401 Unauthorized` and this body.

### Probe: malformed token

**Request:** `GET` with the literal header `Authorization: Bearer not-a-jwt`.

**Response observed:** `403 Forbidden`

```json
{
  "message": "Access denied. Invalid token."
}
```

**Validation rule observed:** a malformed bearer token is rejected with `403 Forbidden` and this body. Note that a missing token and an invalid token return different statuses, `401` and `403` respectively.

---

## POST `/auth/logout`

**Method and path:** `POST /auth/logout`
**Headers:** `Authorization: Bearer <jwt>`. No request body and no `Content-Type` header were sent.

### Probe: valid token

**Request:** `POST` with the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

**Response observed:** `200 OK`

```json
{
  "status": "success",
  "message": "Logout successful. Please delete the token from your client storage."
}
```

Note that this response uses a `status` field, which the other endpoints probed here do not.

**Validation rule observed:** a token supplied as `Authorization: Bearer <jwt>` is accepted. Whether logout revokes the token server-side was not probed; the same token was not re-sent to a protected route afterwards.

### Probe: missing token

**Request:** `POST` with no `Authorization` header, no request body and no `Content-Type` header.

**Response observed:** `401 Unauthorized`

```json
{
  "message": "Access denied. No token provided."
}
```

**Validation rule observed:** omitting the `Authorization` header is rejected with `401 Unauthorized` and this body.

### Probe: malformed token

**Request:** `POST` with the literal header `Authorization: Bearer not-a-jwt`.

**Response observed:** `403 Forbidden`

```json
{
  "message": "Access denied. Invalid token."
}
```

**Validation rule observed:** a malformed bearer token is rejected with `403 Forbidden` and this body.

---

## Unverified routes

`POST /auth/forgot-password` and `POST /auth/reset-password` are **unverified**. They were not probed. This document makes no claim that they exist, that they work, or what their request or response shapes are. Do not build against them until they are probed and recorded here.

---

## Not established by these probes

These details are not claimed, because no recorded probe establishes them:

- signup field aliases; only `email`, `name` and `password` were sent
- what the service accepts as a valid email format, and which part of `not-an-email` was rejected
- the reason behind any `500 Internal Server Error`; the body is generic and identifies no field
- any password length rule; six requests with an identical, otherwise-valid body returned five `500`s and one `201`, so the service is non-deterministic and no length-based cause can be assigned to any prior `500`, including the original 10-character probe
- whether a signup or login `500` indicates rejected input, non-deterministic failure, or an unrelated server fault — these are no longer separable given the determinism finding
- JWT claims other than the observed seven-day difference between `iat` and `exp`
- whether logout revokes the token server-side
- behavior for expired tokens
- the login response for an unregistered email
- profile behavior when the token refers to a deleted user