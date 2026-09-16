# Authentication API contract

**Base URL:** `https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run`

This document contains only results recorded from probes of the deployed service. Each entry states the request used and the response observed. No behavior inferred from backend source code is included as an established contract.

## Probe method

Requests were sent to the deployed service using Postman, except the password-length sweep, which was sent with `scripts/probe-password-boundary.sh` so that a single variable could be isolated across many attempts.

JSON probes used `Content-Type: application/json`. Authenticated probes used the literal header `Authorization: Bearer <jwt>`, where `<jwt>` was the token returned by the successful login probe.

Every negative probe uses a freshly generated, previously unregistered email of the fixed shape `probe-<run-id>-<n>@example.com`. This is deliberate: a reused email would cause a duplicate-account failure that could be mistaken for a field-validation failure. Any entry below that does not state a fresh email was used should be treated as unverified.

### Superseded results

An earlier revision of this document recorded a fifteen-character signup password as the only accepted length, and a later revision recorded nine characters as accepted and ten as rejected, implying a boundary somewhere in between. Neither was produced with repeated attempts, so neither could distinguish a real validation rule from an intermittent server failure. The probe recorded under [Probe: signup, duplicate name](#probe-signup-duplicate-name-password-length-is-not-established) shows the actual cause: `name` was not varied across those earlier attempts, and a reused `name` independently produces the same `500` that was previously attributed to password length. They are noted here rather than deleted so a reader can tell which observation describes the service today, and neither should be treated as an established password-length boundary.

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

### Probe: signup, duplicate name (password length is not established)

**Background:** six requests were first sent with `name` held to the fixed value `"Probe User"` and password held to a fixed 9-character value, varying only a fresh, previously unregistered `email` on each request. One succeeded, five returned `500 Internal Server Error` with the generic body `{"message": "Internal server error"}`. Because `name` never varied in that batch, it was a candidate cause left untested, not a cause ruled out.

**Isolating request:** two unauthenticated `POST` requests to `/auth/signup`, header `Content-Type: application/json`, sent back to back. `name` (`"Probe Duplicate Test"`) and `password` (`"Probe1234"`) were identical on both requests; only `email` differed, and each email was fresh and previously unregistered:

```json
{"email": "probe-name-01@example.com", "name": "Probe Duplicate Test", "password": "Probe1234"}
{"email": "probe-name-02@example.com", "name": "Probe Duplicate Test", "password": "Probe1234"}
```

**Responses observed:**

| Run | Email | Status |
|---|---|---|
| 1 | probe-name-01@example.com | `201 Created` |
| 2 | probe-name-02@example.com | `500 Internal Server Error`, body `{"message": "Internal server error"}` |

A follow-up control batch of six requests, each with a distinct `name` and a distinct fresh `email`, all returned `201 Created` with no failures, consistent with this result.

**Validation rule observed:** submitting a `name` that is already registered to another account causes `/auth/signup` to reject the request with `500 Internal Server Error`, even when `email` and `password` are valid and unique. This is reproducible on demand with two otherwise-identical requests differing only in whether `name` was reused, and is corroborated by a six-request batch in which no name was reused and no request failed.

This contradicts the documented behavior for a duplicate `email`, which correctly returns `400 Bad Request` with `{"message": "User already exists"}` (see **Probe: duplicate email**, above). A duplicate `name` instead falls through to a generic `500`, so a client cannot distinguish "this name is taken" from an unrelated server fault by status code or body alone. **This should be filed as a backend defect**: duplicate-name rejection should return a `4xx` status with a message that identifies the field, matching the pattern already used for duplicate email.

This also resolves the earlier password-length ambiguity: the original 9-character (accepted) and 10-character (rejected) probes each used a fresh email but did not vary `name` between attempts across the full password-boundary probe set; the 10-character rejection is therefore explained by name reuse rather than password length, and no password-length minimum, maximum, or boundary is established by any probe in this document.

**Consequence for the signup screen:** the client cannot derive a password-length validation rule from this contract, and should not guess one. It should, however, expect that a duplicate `name` produces a `500` rather than a `400` until the backend defect above is fixed — a screen that surfaces raw `500` messages to the user would show a generic server error for what is actually a "name already taken" case.

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

**Validation rule observed:** not established. This probe used `"name": "Probe User"`, the same value shown under [Probe: signup, duplicate name](#probe-signup-duplicate-name-password-length-is-not-established) to independently cause a `500` when reused across requests. If an earlier probe in this document's history also used that name, this result may be explained by name reuse rather than the missing `email`, and cannot be trusted as-is. **Needs re-probe** with a `name` guaranteed not reused anywhere else in this document before this can be recorded as a rule.

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

**Validation rule observed:** not established, for the same reason given under **Probe: missing email**: this probe also used `"name": "Probe User"`, a value independently shown to cause a `500` when reused. **Needs re-probe** with a guaranteed-unused `name`.

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

**Validation rule observed:** not established, for the same reason given under **Probe: missing email**: this probe also used `"name": "Probe User"`. **Needs re-probe** with a guaranteed-unused `name`.

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

**Validation rule observed:** not established. In addition to the generic `500` giving no field-specific reason, this probe also used `"name": "Probe User"`, a value independently shown to cause a `500` when reused. A client cannot derive an email format rule from this contract. **Needs re-probe** with a guaranteed-unused `name`.

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
- any password length rule; the apparent 9/10-character boundary is explained by name reuse (see **Probe: signup, duplicate name**), not password length, and no password-length probe in this document used a guaranteed-unique `name`
- the missing-email, missing-password, empty-email, and invalid-email-format signup probes each reused `"name": "Probe User"`, a value shown to independently cause `500`; their results are not trustworthy as field-specific validation rules until re-probed with a unique `name` per request
- JWT claims other than the observed seven-day difference between `iat` and `exp`
- whether logout revokes the token server-side
- behavior for expired tokens
- the login response for an unregistered email
- profile behavior when the token refers to a deleted user