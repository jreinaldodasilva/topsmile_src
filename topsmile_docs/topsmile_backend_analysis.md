# TopSmile --- Backend Codebase: Detailed Analysis & Recommendations

**Date:** 2025-09-03 **Scope:** backend (`/backend/src`), focusing on
code, architecture, security, performance, and maintainability. I
inspected the TypeScript/Express/Mongoose codebase (models, services,
routes, middleware, and `app.ts`) and produced a prioritized list of
findings and concrete recommendations. This document *only* contains
analysis and suggested changes --- no code was changed.

------------------------------------------------------------------------

## Executive summary (TL;DR)

Overall the backend is well structured and follows a service-layer
pattern: routes are thin and delegate to services, models are Mongoose
schemas, and core concerns (auth, scheduling, availability) live in
dedicated modules. The project uses TypeScript with `strict: true`,
express-validator for request validation, Helmet for basic security,
rate limiting on sensitive endpoints, and a number of well-thought-out
improvements (indexes on appointment queries, refresh token model with
TTL index, DOMPurify sanitization usage, and Mongoose transactions in
scheduling logic).

**Strong points** - Clear separation of concerns (routes → services →
models). - Good use of TypeScript (`strict: true`). - Input validation
with `express-validator` on routes. - Security libraries in place:
`helmet`, `express-rate-limit`, DOMPurify used where appropriate. -
Thoughtful Mongoose indexing across the `Appointment` model and
others. - Use of refresh tokens (persisted), TTL index and token cleanup
functionality. - Scheduling logic uses Mongoose transactions and has
explicit conflict detection and buffer logic.

**Top risks / critical findings** (must address before production) 1.
**Default user role is `admin` in the User schema** (dangerous privilege
escalation). See *File-specific notes* below. New registrations could
receive overly-privileged roles. 2. **Password policy mismatch**:
`authService.register` allows 6+ characters but `UserSchema`
pre-validation enforces minimum **8** characters. This inconsistency can
cause runtime validation failures and UX issues. 3. **Refresh tokens
stored in plaintext & rotation flow could be improved**: stored refresh
tokens are raw tokens in DB. Rotation doesn't revoke the exact used
token immediately (relying on housekeeping). This enables risk of
refresh-token replay if DB or backups leak tokens. 4. **Potential
double-booking / concurrency edge case under high load**: scheduling
uses transactions but the current pattern (check availability → create
appointment within transaction) may still allow races in high
concurrency because two transactions may both succeed if they do not
conflict at the DB-write level. The current approach reduces risk but is
not bulletproof for extremely concurrent booking scenarios. 5. **Rate
limiting uses in-memory store** (`express-rate-limit` default memory
store). That is fine for single-instance but will not work across
multiple instances. 6. **Lack of automated tests** for critical flows
(auth, scheduling, conflict detection). The `package.json` contains
`jest`, but I could not find tests in the backend.

------------------------------------------------------------------------

## Repo snapshot

-   `Node >=18` (engines). TypeScript project with `tsconfig.json`
    (`strict: true`).
-   Backend entry: `backend/src/app.ts`.
-   Structure: `src/models`, `src/services`, `src/routes`,
    `src/middleware`, `src/config`.
-   Uses Express + Mongoose; `nodemailer` present for emails;
    `date-fns` + `date-fns-tz` for date handling.

------------------------------------------------------------------------

## Important file-level findings (selected)

> I list the most important files and what I found. For full
> file-by-file comments, I can produce a separate line-by-line report.

### `backend/src/models/User.ts`

-   **Default role**: the schema sets `role` default to `'admin'`. This
    is risky --- newly created users should not be *admin* by default.
    Prefer a safe default (e.g. `assistant`, or require explicit admin
    assignment).
-   **Password visibility**: `password` uses `select: false` and
    `toJSON` deletes password --- good.
-   **Password complexity mismatch**: schema `pre('validate')` enforces
    a minimum length of 8 (and common password check), while
    `authService.register` currently allows 6 --- inconsistent.

**Recommendation:** change schema default role to a minimal-permission
role (e.g. `assistant` or `manager` depending on business rules), and
align server-side validation (+ UI) to a single policy (min length 10+,
strength checks). Consider offering 2FA.

### `backend/src/services/authService.ts`

-   Implements access tokens and refresh tokens, refresh storage in DB,
    `cleanupOldRefreshTokens()` (revokes oldest tokens after limit).
    Good structure.
-   **Plaintext refresh tokens**: stored tokens are plain strings. If
    the DB is leaked, tokens can be used immediately to mint access
    tokens.
-   **Rotation behavior**: `refreshAccessToken()` issues a new refresh
    token and creates a new DB entry --- but it does not reliably revoke
    the used token immediately (it relies on `cleanupOldRefreshTokens()`
    which revokes old tokens in bulk). Immediate revocation of the
    presented refresh token is recommended to avoid replay.
-   **Access token generation**: uses `JWT_SECRET` with good startup
    checks (app refuses to start in production without a real secret)
    --- good.

**Recommendations:** - Store *hashed* refresh tokens (e.g. SHA-256 or
HMAC) in DB and compare hash of supplied token --- prevents DB leaks
from leaking usable tokens. - On refresh, revoke the presented refresh
token (mark `isRevoked: true`) and issue a new refresh token (rotate).
Add reuse detection: if a refresh token was already used/revoked, flag
and revoke all tokens for that user and force re-auth. - Keep refresh
token expiry relatively short and reduce MAX_REFRESH_TOKENS_PER_USER to
a conservative number. - Consider delivering refresh tokens via
HttpOnly, Secure cookies (with SameSite=strict/lax) instead of raw JSON
response, depending on client architecture.

### `backend/src/services/schedulingService.ts` & `availabilityService.ts`

-   The service uses Mongoose transactions, buffer times, and helper
    `hasTimeConflict()` to detect overlaps --- thoughtful and includes
    many improvements (lean queries, better error handling).
-   **Concurrency caveat**: a pure check-then-insert pattern inside a
    transaction may not guarantee no-overlap in all scenarios (two
    concurrent transactions can read the same state and commit different
    documents that overlap if there is no write conflict on the same
    document). This approach reduces risk but doesn't provide absolute
    atomic non-overlap guarantees.

**Recommendations:** - Consider one of the following stronger strategies
to prevent double-booking: 1. **Provider lock (distributed lock)**:
acquire a short Redis lock on `provider:<id>` while performing
check-and-create. 2. **Calendar document update with conditional
operator**: keep a `ProviderCalendar`/`ProviderSchedule` document where
you `findOneAndUpdate` with an `$push` guarded by a conditional
`$elemMatch` or precondition; writes to the same document are
serialized. This converts the multi-document problem into a
single-document atomic update. 3. **Unique interval enforcement**:
difficult in MongoDB but possible with time-slot identifiers (if slots
are discretized). - Document the requirement: MongoDB transactions
require a replica set --- ensure production DB is configured accordingly
and add a fallback code path or explicit check at startup.

### `backend/src/app.ts` and security middleware

-   Helmet & CSP configured, but `styleSrc` allows `'unsafe-inline'`
    which is acceptable in dev but should be hardened in prod.
-   `CORS` uses an allowlist and supports regexes --- good, but confirm
    environment-driven allowed origins in production.
-   `app.set('trust proxy', 1)` is toggled based on env --- good.
-   Error handling middleware logs stack traces only in non-prod ---
    good. However logs use `console.*` --- consider structured logging
    and no sensitive data in logs.

**Recommendations:** - Use structured logger (e.g. `pino`, `winston`)
and add request ID/correlation ID support. - Use
`express-mongo-sanitize` and `hpp` to further protect against NoSQL
injection and parameter pollution. - Remove `'unsafe-inline'` in the CSP
for production releases; consider a nonce-based approach for allowed
inline scripts/styles.

### `backend/src/middleware/auth.ts` & `roleBasedAccess.ts`

-   Auth middleware attaches `auditContext` to requests --- great idea
    for later auditing.
-   `roleBasedAccess` defines role hierarchy and resource permissions.
    Ensure the middleware is invoked for every sensitive route ---
    currently routes use `authenticate` (good), but confirm `authorize`
    checks are applied consistently.

**Recommendations:** - Add a central checker that enforces tenant
isolation (i.e. every DB read/write from a route either includes
`clinic: req.user.clinicId` or uses a wrapper that enforces the filter
automatically). - Persist audit logs for sensitive actions (who changed
what, when, and from which IP).

### Indexes & performance

-   Appointment model contains many pragmatic indexes and compound
    indexes for schedule queries --- this is excellent.

**Recommendations:** - Make sure indexes are built/migrated in
production (index creation can impact startup). Consider a migration
step or tooling to ensure indexes are in sync. - Add `explain()` checks
for heavy queries during load testing and consider caching read-heavy
endpoints (appointment types, provider info) via Redis.

------------------------------------------------------------------------

## Security checklist (high-level)

-   [ ] **Rotate & hash refresh tokens** in DB. Implement token reuse
    detection.
-   [ ] Enforce consistent and stronger password policy (min 10 chars +
    checks or use a library like `zxcvbn`).
-   [ ] Change `User` default role away from `admin`.
-   [ ] Use a distributed rate-limit store (Redis) in production.
-   [ ] Add `express-mongo-sanitize` and `hpp` to the middleware stack.
-   [ ] Avoid returning sensitive fields in API responses. Add per-model
    `toJSON` transforms and role-based field filtering.
-   [ ] Use secure cookie for refresh tokens if front-end supports it;
    otherwise, document safe storage patterns for clients.
-   [ ] Add account lockout / progressive delays after failed logins and
    administrator alerts for repeated failures.

------------------------------------------------------------------------

## Testability / CI / Observability

-   No tests found for backend. Add unit tests for services and
    integration tests for critical flows (auth, token refresh, booking
    concurrency). Use `jest` + `supertest` and in-memory MongoDB
    (`mongodb-memory-server`) for integration tests.
-   Add health endpoints (`/healthz`, `/ready`) and metrics endpoint for
    Prometheus.
-   Add CI pipeline (GitHub Actions / GitLab CI) to run lint + tests +
    type checks and optionally run a lightweight API contract test
    (Swagger/OpenAPI validation).

------------------------------------------------------------------------

## Data privacy & compliance

-   Sensitive PII fields (e.g., `cpf`, `privateNotes` and patient
    contact data) are present. Consider:
    -   Field-level encryption or database encryption at rest (e.g.,
        MongoDB Client-Side Field Level Encryption or application-level
        encryption for very sensitive fields).
    -   Strict access controls and audit logs for PII access.
    -   Data retention & deletion policies (soft delete vs hard delete),
        and an endpoint / job to purge old/consented data.

------------------------------------------------------------------------

## Suggested prioritized roadmap (concrete next steps)

**Immediate (P0 --- fix in the next days before wide production
use)** 1. Change default `User.role` from `admin` to a minimal role and
enforce explicit role assignment (or admin invite flow). (High/critical)
2. Fix password policy mismatch (make both auth route and schema require
same minimum --- I recommend \>= 10 and zxcvbn check). (High) 3. Hash
refresh tokens in DB and implement immediate revocation on rotate; add
reuse detection. (High) 4. Switch auth rate-limit store to Redis in
production. (High)

**Near term (P1 --- weeks)** 1. Add unit and integration tests for auth
flows and scheduling conflict detection; include concurrency tests for
booking. (Medium) 2. Replace console logging with structured logger and
add correlation/request IDs. (Medium) 3. Implement stronger concurrency
guarantees for appointment creation (Redis lock or calendar document
pattern). (Medium/High depending on traffic) 4. Add
`express-mongo-sanitize`, `hpp`, and tighten CSP for production.
(Medium)

**Medium term (P2 --- 1--2 months)** 1. Add background job queue
(BullMQ + Redis) for email/SMS sending and retries. (Medium) 2. Add
OpenAPI/Swagger documentation and API versioning. (Medium) 3. Implement
field-level encryption or mask PII and ensure audit logs for PII access.
(Medium)

**Longer term (P3)** - Add observability (Prometheus metrics + tracing),
autoscaling guidance, and full load testing.

------------------------------------------------------------------------

## Concrete code suggestions (examples)

### 1) Hash refresh tokens before storing (concept)

``` ts
// Issue a refresh token (server-side)
const raw = crypto.randomBytes(48).toString('hex');
const hash = crypto.createHash('sha256').update(raw).digest('hex');
await RefreshToken.create({ tokenHash: hash, userId, expiresAt, deviceInfo });
// send `raw` to client only once over TLS
```

### 2) Revoke presented refresh token on rotate

``` ts
// In refresh flow:
await RefreshToken.updateOne({ _id: stored._id }, { isRevoked: true });
// then create a new hashed refresh token and return it
```

### 3) API error type class (centralize error handling)

``` ts
export class ApiError extends Error {
  public status: number;
  public code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
// Throw ApiError(403, 'Access denied', 'ACCESS_DENIED') and map it in central handler.
```

### 4) Strengthen booking atomicity (concept)

-   Option A: Redis lock around `provider:<id>` for the entire check +
    create.
-   Option B: Single `ProviderCalendar` document and do
    `findOneAndUpdate` with check and `$push` in one atomic operation.

------------------------------------------------------------------------

## Other notes / housekeeping

-   Remove any debug console printing of environment-sensitive variables
    in production startup logs.
-   Ensure `NODE_ENV` is set correctly and the app fails fast if
    required environment variables are missing (I saw this is partially
    implemented --- consider centralizing env validation with `zod` or
    `joi`).
-   Reduce occurrences of `any` in key modules. I counted \~23 uses of
    `any` across the backend; top files:

```{=html}
<!-- -->
```
    - src/routes/appointmentTypes.ts — ~10 occurrences
    - src/routes/providers.ts — ~9 occurrences
    - src/routes/appointments.ts — ~8 occurrences
    - src/routes/patients.ts — ~8 occurrences
    - src/services/authService.ts — ~8 occurrences
    - src/services/schedulingService.ts — ~7 occurrences
    - src/middleware/auth.ts — ~6 occurrences
    - src/services/patientService.ts — ~5 occurrences
    - src/models/Appointment.ts — ~4 occurrences
    - src/models/Contact.ts — ~4 occurrences

Reducing `any` usage improves type-safety and maintainability.

------------------------------------------------------------------------

## If you want, next I can (pick one):

-   Produce a *file-by-file annotated report* containing line numbers
    and suggested code snippets for the top 20 findings.
-   Create a prioritized, actionable 2-week sprint backlog with
    estimated story points for each fix.
-   Draft safe migration steps for moving refresh tokens to hashed
    values (DB migration plan + backward compatibility strategy).

Tell me which of these (or any other focused task) you want next and I
will produce it.
