# TOPSMILE PROJECT REVIEW

---

# Quick repo snapshot (high level)

* Stack: **Node (TypeScript) backend (Express + Mongoose)** + **React (TypeScript, CRA style) front-end**.
* Backend major pieces: `backend/src` (routes, services, models) — models include `User`, `RefreshToken`, `Clinic`, `Appointment`, `Patient`, etc. Auth is JWT + DB-stored refresh tokens.
* Frontend major pieces: `src` with React contexts (AuthContext, ErrorContext), pages (Login, Admin, Home), service layer (`src/services/http.ts`, `src/services/apiService.ts`) that implements token refresh & retry.
* Tests: backend unit & integration tests exist (`backend/tests/...`).
* Missing from repo: no top-level `Dockerfile` or `docker-compose.yml` found, no CI config (e.g. GitHub Actions) in repo root.
* Minor: the archive extracted into a nested folder (`topsmile_prj/topsmile_prj/...`) — that can cause confusion in build contexts.

---

# Executive summary of behavior and security posture

* **Auth flow:** JWT access tokens + DB refresh tokens. Access tokens are short-lived; refresh tokens are created in DB and rotated on use (the code revokes the used refresh token and creates a new one) — that’s good practice. Passwords are hashed with bcrypt (salt rounds 12) in the Mongoose pre-save hook. The backend revokes all refresh tokens on password change — good.
* **Refresh tokens storage:** currently stored in database in plaintext (i.e., the raw token string). Rotation exists, but storing raw refresh tokens is a risk if DB is leaked — best practice is to store **hashed** refresh tokens.
* **Frontend token handling:** access & refresh tokens are stored in `localStorage`. This is functional but increases exposure to XSS. A more secure approach is `httpOnly` secure cookies for the refresh token and either an in-memory or short-lived access token in the browser.
* **Input sanitation & validation:** express-validator is used in routes and DOMPurify appears in a few places — good. Some route-level sanitization exists.
* **Rate limiting:** used on auth endpoints (good).
* **Logging & console usage:** many `console.log` / `console.error` / `console.warn` usages remain (particularly in `backend/src/app.ts`) — replace with structured logger and avoid logging secrets.
* **Environment config:** code validates important env variables for production and exits if critical ones (e.g. JWT\_SECRET) are missing — good.
* **Tests:** unit & integration tests are present for critical auth flows. Good to expand.

---

# Notable findings — logic, inconsistencies, missing or risky pieces

Below are specific findings with file references, short explanation and severity.

---

## 1) **Refresh token storage: plain-text tokens in DB**

**Where:** `backend/src/models/RefreshToken.ts`, `backend/src/services/authService.ts` (createRefreshToken, refreshAccessToken, logout, logoutAllDevices)
**What I saw:** refresh tokens are created as random strings and saved to DB (`token: <raw string>`). Refresh flow rotates tokens (revokes used token and creates new one), but stored tokens are not hashed.
**Why it matters:** If DB is leaked, an attacker can directly use stored refresh tokens. Best practice: store only a **hash** of the refresh token (e.g., use HMAC or bcrypt) and when verifying a refresh token, hash the provided token and compare.
**Severity:** **High** (sensitive authentication tokens)

**Suggested fix:** store `hash(token)` in DB, not raw token. When issuing a new refresh token, send the raw token to client but only store hashed version. On rotate/verify, hash incoming token and find by hash (or use constant-time compare). Also use `findOneAndUpdate({hash:..., isRevoked:false, expiresAt:{$gt:...}}, {$set:{isRevoked:true}})` to atomically revoke and avoid race conditions (see next point).

---

## 2) **Potential race condition in refresh token rotation**

**Where:** `backend/src/services/authService.ts` — `refreshAccessToken` reads `RefreshToken.findOne(...)` then sets `stored.isRevoked = true; await stored.save();`
**What I saw:** `findOne()` then `stored.save()` is two DB operations; two concurrent requests using the same refresh token could both pass `findOne()` before the save, resulting in double-use before revocation.
**Why it matters:** Refresh tokens are sensitive; an attacker reusing a refresh token concurrently could get an extra valid pair of tokens.
**Severity:** **High → Medium** (depends on threat model, but fix is straightforward)

**Suggested fix:** use an **atomic** update operation that sets `isRevoked` to true while returning the matched doc, e.g.:

```ts
const stored = await RefreshToken.findOneAndUpdate(
  { token: tokenString, isRevoked: false, expiresAt: { $gt: new Date() } },
  { $set: { isRevoked: true } },
  { new: true } // or return the previous doc depending on logic
).populate('userId');

if (!stored) throw new Error('invalid or expired');
```

This ensures only one caller can successfully claim the token.

If you move to hashed refresh tokens (recommended), the same atomic pattern still applies (query by token hash with `isRevoked:false`).

---

## 3) **Tokens stored in browser localStorage (frontend)**

**Where:** `src/services/http.ts` (ACCESS\_KEY, REFRESH\_KEY; get/set to localStorage), `apiService` uses that client code.
**What I saw:** both access & refresh tokens are kept in localStorage. HTTP client implements refresh+retry logic with a single `refreshingPromise` to prevent duplicate refreshes — good attempt at concurrency control.
**Why it matters:** `localStorage` is vulnerable to XSS; refresh tokens in localStorage mean XSS can leak them. Using `httpOnly`, `Secure`, `SameSite` cookies for the refresh token reduces risk and uses standard browser cookie behavior.
**Severity:** **Medium** (practical in presence of XSS vector)

**Suggested fix:** move refresh token to `httpOnly` cookie (set by server on login/refresh). Keep access token short-lived and in memory (or use Authorization header with cookie+server-side session rotation). Alternatively adopt SameSite/secure cookies and server-side token verification.

---

## 4) **Console logging and possible sensitive logging**

**Where:** many places: `backend/src/app.ts` (lots of `console.error`), routes, some frontend components.
**What I saw:** debug logging sprinkled with console.\* and sometimes error messages include `error.message` directly. Tests contain sample passwords (expected).
**Why it matters:** Leaking sensitive info into logs, or noisy logs in production. Also logging via console.\* is less controllable than using a logger (winston/pino) where you can scrub secrets and control levels.
**Severity:** **Medium**

**Suggested fix:** add structured logging library, centralize logger with levels and sanitization. Remove or guard any logs that print user data or tokens.

---

## 5) **Refresh token & logout behavior inconsistencies**

**Where:** `authService.logout`, `logoutAllDevices`, `change password` flows.
**What I saw:** logout revokes a refresh token record; password change calls `logoutAllDevices` (revokes all tokens) — good. I recommend to also revoke access tokens implicitly (not possible with stateless JWTs unless you support a blacklist) — consider an access-token blacklist or short access token windows plus revocation of refresh tokens (already done).
**Severity:** **Low → Medium** (depends on policy needs)

**Suggested fix:** either keep access tokens extremely short (e.g. 5–15 min) + refresh with rotation (already implemented), or implement a token blacklist / signature versioning (e.g. store `tokenVersion` on user and include it in tokens; increment version to invalidate issued tokens).

---

## 6) **Password policy is weak/unclear**

**Where:** `backend/src/models/User.ts` password validators and pre-save hashing. Frontend registration forms.
**What I saw:** the model enforces minimum length of 6 in some places. There’s also a weak-password blacklist check for “commonWeakPasswords”. Minimum length 6 is low; enforce stronger rules (min 8 or 10, plus complexity or passphrase encouragement). Client-side checks appear present but server-side should be authoritative.
**Severity:** **Medium**

**Suggested fix:** set minimum length to 8–10+, require checks against common password lists (have that), and optionally add zxcvbn strength meter on front-end for guidance. Enforce rate-limits + account lockouts.

---

## 7) **Atomicity and consistency across services and models**

**Where:** several service functions call multiple DB writes without transactions (e.g., create clinic + user). MongoDB multi-document atomicity is limited unless using sessions/transactions (when you use replica sets).
**What I saw:** some operations that create related entities do sequential writes. If one write fails mid-way you can leave partial state.
**Severity:** **Low → Medium**

**Suggested fix:** where correctness matters (e.g., creating clinic + admin user, or appointment + availability change), use MongoDB transactions (sessions) if running on a replica set/production cluster.

---

## 8) **Input sanitation & XSS on server-rendered HTML email templates**

**Where:** `backend/src/app.ts` email HTML templates (there’s a template that uses `${name}` inside HTML)
**What I saw:** template interpolation is used in HTML emails — ensure data is sanitized or escaped to prevent injection into templates. While emails aren’t typically rendered as web pages on the server, a malicious `name` with HTML could cause undesirable output in mail clients.
**Severity:** **Low**

**Suggested fix:** sanitize or escape interpolated fields.

---

## 9) **Missing infra/dev tooling**

* No `Dockerfile` / `docker-compose.yml` found (recommended).
* No CI pipeline (GitHub Actions / GitLab CI).
* No automated security checks (dependabot or `npm audit` integrated).
  **Severity:** **Low→Medium** (important for production readiness)

---

## 10) **UI / Frontend issues - TODOs and incomplete admin pages**

**Where:** several frontend admin pages and contexts contain TODOs: `src/contexts/ErrorContext.tsx`, `src/pages/Admin/*` and other pages.
**What I saw:** placeholders and "TODO" comments — some admin pages may be scaffolded but not fully implemented.
**Severity:** **Low** (depends on target feature completion)

---

## 11) **Possible duplication / nested folder structure**

**Where:** top-level extracted folder is `topsmile_prj/topsmile_prj/...` (so the repo root is nested).
**What I saw:** this can confuse build scripts and Docker context paths.
**Severity:** **Low** but practical nuisance.

---

# Concrete, prioritized roadmap (actionable, file-specific steps)

I'll group tasks by priority: **Critical**, **High**, **Medium**, **Low**. For each item I list what to change and where.

---

## Critical (must do before production / public launch)

1. **Stop storing raw refresh tokens — store hashed refresh tokens.**

   * Files: `backend/src/models/RefreshToken.ts`, `backend/src/services/authService.ts` (createRefreshToken, refreshAccessToken, logout).
   * Change: when creating a refresh token, store `hash(token)` (HMAC or bcrypt). When verifying refresh token, hash the submitted token and compare. Continue rotating tokens, but only store hashed form. Document that raw token is only returned to client on creation.
   * Rationale: reduces risk if DB is leaked.

2. **Make refresh-token rotation atomic to avoid race conditions.**

   * Files: `backend/src/services/authService.ts`.
   * Change: use `findOneAndUpdate` with `isRevoked:false` and `expiresAt` conditions and `{$set: { isRevoked: true }}` as an atomic operation.

3. **Protect refresh tokens from XSS — move refresh token off `localStorage`.**

   * Files: `src/services/http.ts`, backend auth endpoints (login/refresh) must set `Set-Cookie` with `httpOnly`, `Secure`, `SameSite=Strict` for refresh tokens. Update API usage in frontend accordingly (send credentials / cookie).
   * Change: server returns refresh token set as `httpOnly` cookie; client-side `http.ts` should stop saving refresh token into localStorage and send requests to endpoints with `credentials: 'include'`. Access tokens can be kept in memory or short-lived local storage if absolutely necessary.

4. **Ensure `JWT_SECRET` and other critical env vars are enforced in production.**

   * Files: `backend/src/app.ts` (already checks but confirm CI/deploy emits errors). Make sure to remove any "dev secret" fallback in production or fail fast (code is already designed to exit in production but double-check image/docker settings in CI).

---

## High priority (should be addressed soon)

5. **Centralize logging & remove sensitive console logs.**

   * Files: `backend/src/app.ts`, `backend/src/**` anywhere `console.*` is used.
   * Change: introduce `winston` or `pino` with structured logging, log levels, and scrubbing pipes. Replace console.\* with the centralized logger.

6. **Stronger password policy & 2FA option.**

   * Files: `backend/src/models/User.ts`, frontend login/registration components (`src/pages/Login/*`).
   * Change: bump min password length to 8–10, integrate zxcvbn or similar for strength feedback client-side. Plan for optional 2FA (TOTP) as new feature.

7. **Standardize error responses & central error handler.**

   * Files: `backend/src/app.ts` (add a single Express error handler), align route responses to a schema `{ success: boolean, message: string, code?: string, data?: ... }`.

8. **Use atomic DB transactions for multi-step operations.**

   * Files: where two or more DB writes should be one atomic operation (e.g., clinic + admin user creation). Implement using Mongo sessions if cluster/replica set supports it.

---

## Medium priority (quality & reliability)

9. **Add Dockerfile(s) and docker-compose to simplify local/dev & deployment.**

   * Files: root `Dockerfile`, `docker-compose.yml`. Build two services: `backend` and `frontend` (or serve front-end statically from backend). Add a `mongo` service for development.

10. **Add CI pipeline & tests automation.**

    * Add GitHub Actions to run `npm install`, `lint`, `test` for both backend & frontend, and `build` step. Also run `npm audit` and fail on high vulnerabilities.

11. **Improve frontend token refresh concurrency & error handling.**

    * Files: `src/services/http.ts`. Ensure `refreshingPromise` is robust for various edge-cases (refresh fails / concurrent requests during logout). If moving to cookie-based refresh, simplify logic.

12. **Unit/integration test coverage expansion.**

    * Add tests for refresh token rotation edge cases, race conditions, token revocation on password change, role-based access (middleware), and API contract tests between backend and frontend.

13. **Sanitize email template interpolations.**

    * Files: `backend/src/app.ts` (email templates) — escape user-supplied content in templates.

---

## Low priority (UX, features, polish)

14. **Add observability:** Sentry (errors), Prometheus metrics endpoints.
15. **Add background jobs:** email sending, SMS reminders, appointment reminders via queue (BullMQ + Redis).
16. **Add audit logs for critical actions:** login, logout, password change, permission changes.
17. **Accessibility review & responsive improvements** for UI pages and forms.
18. **Feature suggestions:** patient portal (view appointments), calendar sync (Google Calendar), SMS reminders, invoicing & payments, analytics dashboard, multi-language support.

---

# Suggested implementation plan (concrete steps)

Below is a recommended order for execution — each item is tied to a file/area you can open and patch.

**Phase A — Secure auth & tokens (most urgent):**

1. Implement hashed refresh tokens:

   * Modify model `backend/src/models/RefreshToken.ts` to store `tokenHash` instead of `token`.
   * Update `createRefreshToken` to `const token = generate(); const hash = hashToken(token); save hash`.
   * Update `refreshAccessToken` to hash incoming token and query by hash.
   * Update `logout` to hash incoming token to find and revoke the DB entry.
   * Update tests to expect hashed storage.

2. Make refresh rotation atomic:

   * In `refreshAccessToken`, use `findOneAndUpdate(...)` with conditional `isRevoked:false` and check return to ensure only one claim succeeds.

3. Migrate frontend to `httpOnly` cookie refresh flow:

   * Backend: on login/refresh response, set `Set-Cookie` header for `refresh_token` (httpOnly, secure, SameSite=strict, path=/api/auth/refresh or global path). Keep access token in JSON response if needed.
   * Frontend: change `src/services/http.ts` to stop storing refresh token in `localStorage`, and update fetch to `credentials: 'include'` and calls to `/api/auth/refresh` without passing token in body or localStorage.

**Phase B — Hardening & tooling:**
4\. Replace console logs with `winston/pino` and add log-level env var.
5\. Add Dockerfile(s) and `docker-compose.yml`.
6\. Add GitHub Actions: run tests, lint, build on PR.
7\. Add Sentry or error aggregator.

**Phase C — UX & features:**
8\. Improve password policy & add optional 2FA.
9\. Expand test coverage.
10\. Add audit logs & admin UI for viewing sessions and revoking tokens.
  
---
---
---


**Deep-dive assessment of the software architecture and design implementation**
---

## 🔎 1. **Architecture Overview**

The project has a **monorepo-style structure** with two main parts:

* **Backend** (`backend/`): Node.js + TypeScript + Express + Mongoose, providing REST APIs.
* **Frontend** (`src/`): React + TypeScript, with API service wrappers and page components.

Supporting infrastructure:

* **Database**: MongoDB with Mongoose models (User, RefreshToken, Patient, etc.).
* **Auth**: JWT + refresh token rotation, handled by `authService.ts`.
* **Tests**: Jest-based unit and integration tests in `backend/tests`.

This is a **classic client–server separation** with token-based authentication. The architecture is sound for a SaaS-style healthcare app.

---

## 🔎 2. **Backend Flow**

### Authentication

* `authService.ts` handles:

  * **Registration** (`register`) → hash password, save user, create access+refresh tokens.
  * **Login** (`login`) → bcrypt password check, issue new tokens.
  * **Refresh** (`refreshAccessToken`) → verify refresh token, revoke old one, issue new pair (rotation security).
  * **Logout** (`logout`) → revoke refresh token.
* Middleware (`middleware/auth.ts`) validates JWTs for protected routes.
* Refresh tokens stored in `RefreshToken` collection with TTL index (expires after X days).

✅ **Strengths**

* JWT rotation is implemented (revokes used refresh tokens).
* Payload includes role + clinicId → supports multi-tenancy.
* Access token short-lived, refresh token longer-lived → correct design.

⚠️ **Issues**

* **Bug**: In `login`, it calls `createRefreshToken` but then returns `refreshToken: r` (undefined variable).
* **Inconsistent refresh handling**: Some places issue new refresh tokens, some only access tokens. Needs standardization.
* **No password reset flow** (only register/login).
* **Error handling** is inconsistent: some functions throw `Error`, others return `{ success: false, message }`.
* **Console logging** in production code (found via scan) → should be replaced with structured logging.

---

### Patients module

* `routes/patients.ts` defines CRUD routes, protected by `authMiddleware`.
* Uses Mongoose `Patient` model.
* Some routes marked with `XXX` placeholders → incomplete.

⚠️ **Issues**

* Incomplete implementation (XXX marker).
* No input validation (e.g., Joi/Zod).
* Authorization is minimal: checks for `req.user`, but no fine-grained role-based access control (RBAC).
* Potential for mass assignment: directly spreads `req.body` into Mongoose `create`.

---

### App bootstrap

* `app.ts` wires middleware, routes, error handling.
* CORS configured, JSON parsing applied.
* Database connection via `database.ts`.

✅ **Strengths**

* Modular: services, routes, middleware are separated.
* Centralized error handler in `app.ts`.

⚠️ **Issues**

* No rate limiting on login/refresh routes (brute-force risk).
* No input sanitization or schema validation on routes.

---

## 🔎 3. **Frontend Flow**

* `src/services/http.ts` wraps Axios for API calls.
* `src/services/apiService.ts` defines endpoints (auth, patients).
* `LoginPage.tsx` → calls `auth/login`, stores tokens.

✅ **Strengths**

* Clear API layer between components and backend.
* React pages follow separation of concerns.

⚠️ **Issues**

* Token storage method not fully clear — likely localStorage (not shown). This is **XSS-prone**; safer option is `httpOnly` cookies.
* No global error handling for 401/403 (e.g., auto-logout on expired tokens).
* No refresh interceptor in Axios (to auto-refresh tokens).

---

## 🔎 4. **Testing**

* Unit tests for `authService` and `contactService`.
* Integration test for `authRoutes`.

✅ **Strengths**

* Both unit and integration tests present.
* Auth flow partially tested.

⚠️ **Issues**

* No coverage for patient routes.
* No e2e tests that simulate frontend + backend together.
* No tests for refresh token rotation (critical security feature).

---

## 🔎 5. **Cross-Cutting Concerns**

* **Security**

  * JWT secret is in `.env`, but fallback defaults are unsafe (hardcoded strings).
  * Missing CSRF protection (if cookies ever used).
  * No helmet() or secure headers in `app.ts`.

* **Scalability**

  * Refresh token collection can grow unbounded (cleanup exists, but frequency is unclear).
  * No background job runner for periodic cleanup.

* **Code quality**

  * Mix of `async/await` and `.then()` patterns.
  * Inconsistent error handling style.
  * Some duplication (token payload construction repeated in multiple places).

---

## 🔎 6. **Roadmap for Improvements**

### 🔧 Fixes (must-do)

1. Fix `login` bug (`refreshToken: r` → should return actual refresh token).
2. Standardize error handling (use custom `ApiError` or `Result` type consistently).
3. Secure secrets: remove fallback secrets in code, enforce `.env` presence.
4. Replace `console.log` with structured logger (e.g., Winston).
5. Complete patient routes (remove `XXX`).

### 🔒 Security Enhancements

1. Add request validation (Joi/Zod schemas for body/params).
2. Add rate limiting on `/auth/login` and `/auth/refresh`.
3. Use `helmet` for secure headers.
4. Encrypt refresh tokens at rest (currently stored in plaintext).
5. Implement RBAC (admin, clinic manager, staff, patient).

### ⚙️ Backend Features

1. Add password reset (email-based).
2. Add email verification on registration.
3. Add audit logs (logins, patient record access).
4. Add pagination/filtering to patient routes.

### 🖥️ Frontend Improvements

1. Centralized auth context with React hooks.
2. Axios interceptor for auto-refresh on 401.
3. Store tokens more securely (cookies or memory-based).
4. Global error boundary + notification system.

### 🧪 Testing

1. Expand coverage: patients, refresh flow, role-based access.
2. Add e2e tests (Cypress or Playwright).
3. Add load testing for auth endpoints.

---

## ✅ Verdict

* **Overall design is sound**: clear layering, good modularity, proper use of JWT + refresh tokens, React separation.
* **But**: several bugs, incomplete features, missing validations, and some insecure defaults.
* **Conclusion**: The architecture works, but **security hardening, consistency, and feature completeness** are needed before production.

---

Would you like me to **map out the exact request flow** (from frontend → API → service → DB → response) for `login` and `refresh` tokens? That would visually confirm whether the logic fully aligns across layers.
