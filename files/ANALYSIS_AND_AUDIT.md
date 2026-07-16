# Auth Refactor — Analysis, Decisions & Final Audit

---

## 1. Issues Found in the Original Code

### Security Issues

| # | Issue | Location | Severity |
|---|---|---|---|
| S1 | Raw Supabase error messages exposed to users (account enumeration) | `Signup.tsx`, `Login.tsx` | Critical |
| S2 | `signUp()` success immediately navigates to `/feed` — unverified users enter the app | `Signup.tsx:handleSubmit` | High |
| S3 | `emailRedirectTo` pointed to `/feed` — verification link bypasses verification screen | `Signup.tsx:handleSubmit` | High |
| S4 | No brute-force protection on login | `Login.tsx` | High |
| S5 | Login error message partially correct but not fully generic — `includes("invalid")` could leak some errors | `Login.tsx:handleSubmit` | Medium |
| S6 | No protected route implementation evident — unauthenticated access to `/feed` possible | `App.tsx` (assumed) | High |
| S7 | No session initialization check on app load | (no `useAuth` hook) | High |
| S8 | No logout/session cleanup implementation | (not found) | Medium |
| S9 | Alt text on logo is `"CareerLink Nepal logo"` — decorative image in nav should be `aria-hidden` | `Signup.tsx`, `Login.tsx` | Low |
| S10 | Metadata stored in signup not length-capped before Supabase call | `Signup.tsx:handleSubmit` | Low |

### Validation Issues

| # | Issue | Location | Severity |
|---|---|---|---|
| V1 | Custom regex `\S+@\S+\.\S+` is not RFC-compliant — accepts `@.com`, `a@b.c` etc. | Both files | Medium |
| V2 | Email regex duplicated in both Login and Signup | Both files | Low |
| V3 | Validation only runs on submit, not on blur | Both files | Medium |
| V4 | Password only checked for length (≥8); no strength requirements | `Signup.tsx` | Medium |
| V5 | No password strength indicator for users | `Signup.tsx` | Low |
| V6 | College and field fields have no `aria-describedby` for errors | `Signup.tsx` | Medium |
| V7 | Input values are NOT trimmed before validation (spaces pass) | Both files | Medium |
| V8 | No normalisation — `USER@EXAMPLE.COM` and `user@example.com` treated differently | Both files | Low |

### Accessibility Issues

| # | Issue | Location | Severity |
|---|---|---|---|
| A1 | College error `<p>` has no `id` — `aria-describedby` on input is present but broken | `Signup.tsx` | High |
| A2 | Field error `<p>` has no `id` | `Signup.tsx` | High |
| A3 | Form-level error banner has no `role="alert"` or `aria-live` — SR won't announce it | Both files | High |
| A4 | Loading state has no `aria-busy` on button | Both files | Medium |
| A5 | Loading state has no `aria-live` announcement for screen readers | Both files | Medium |
| A6 | No password visibility toggle — users can't verify what they've typed | Both files | Medium |
| A7 | Required indicator `*` is purely visual — no SR equivalent | Both files | Low |
| A8 | `<img>` logo in branded nav has meaningful alt text but is decorative in context | Both files | Low |
| A9 | `<Link>` elements lack focus-visible ring styles | Both files | Low |
| A10 | No `aria-label` on the `<form>` element | Both files | Low |

### Architecture Issues

| # | Issue | Location | Severity |
|---|---|---|---|
| AR1 | Auth calls made directly in page components — no service layer | Both files | High |
| AR2 | Validation logic inline in components — not reusable or testable | Both files | Medium |
| AR3 | Left branding panel duplicated verbatim across Login and Signup | Both files | Low |
| AR4 | No centralised error mapping | Both files | Medium |
| AR5 | `isValidEmail` function duplicated in both files | Both files | Low |
| AR6 | No `useAuth` hook — session state must be re-derived in every component that needs it | (missing) | Medium |
| AR7 | No `ProtectedRoute` component | (missing) | High |

### UX Issues

| # | Issue | Location | Severity |
|---|---|---|---|
| U1 | After signup, user is sent to `/feed` before email is verified | `Signup.tsx` | High |
| U2 | No "check your email" screen — user receives no guidance post-signup | (missing) | High |
| U3 | No password visibility toggle | Both files | Medium |
| U4 | No password strength meter | `Signup.tsx` | Low |
| U5 | Form errors only shown on submit — no blur validation | Both files | Medium |
| U6 | Brute-force lockout has no UX feedback | (missing) | Medium |

---

## 2. Changes Implemented

### New Files Created

```
src/features/auth/
├── types/
│   └── auth.types.ts           # Central TypeScript types
├── schemas/
│   └── auth.schemas.ts         # Zod schemas for login + signup
├── utils/
│   ├── authErrorMapper.ts      # Generic, safe error messages
│   ├── passwordStrength.ts     # Heuristic strength scorer
│   └── loginThrottle.ts        # Client-side brute-force throttle
├── services/
│   └── authService.ts          # All Supabase auth calls
├── hooks/
│   ├── useAuth.ts              # Reactive session state
│   ├── useLoginForm.ts         # Login form logic
│   └── useSignupForm.ts        # Signup form logic
├── components/
│   ├── AuthLayout.tsx          # Shared two-column layout
│   ├── FormAlert.tsx           # Accessible form-level error banner
│   ├── FieldError.tsx          # Accessible inline field error
│   ├── PasswordInput.tsx       # Password input with show/hide toggle
│   ├── PasswordStrengthMeter.tsx # Strength bar + requirements list
│   ├── LoginForm.tsx           # Presentational login form
│   ├── SignupForm.tsx          # Presentational signup form
│   └── ProtectedRoute.tsx      # Route guard
└── index.ts                    # Public API barrel

src/pages/
├── Login.tsx                   # Modified — thin wrapper
├── Signup.tsx                  # Modified — thin wrapper
├── VerifyEmail.tsx             # New — post-signup holding screen
└── EmailVerified.tsx           # New — verification link landing

src/App.tsx                     # Modified — adds ProtectedRoute + new routes
```

### Why Each File Was Created

**`auth.types.ts`** — TypeScript types co-located with the feature prevent circular imports and form a self-documenting API contract.

**`auth.schemas.ts`** — Zod schemas replace ad-hoc regex + manual validation. Benefits: inferred types, normalisation transforms, composable rules, single source of truth for password policy.

**`authErrorMapper.ts`** — Centralises error mapping. All Supabase errors go through here before reaching users. Prevents information leakage. Makes it trivial to add new error cases or change wording globally.

**`passwordStrength.ts`** — Decoupled scorer that can be swapped for zxcvbn without changing any component code.

**`loginThrottle.ts`** — In-memory throttle providing client-side defence-in-depth. Pairs with Supabase's server-side rate limiting.

**`authService.ts`** — Single place where Supabase is called. Components never touch `supabase.auth.*` directly. Makes testing and Supabase migration straightforward.

**`useAuth.ts`** — Reactive session hook with `onAuthStateChange`. Prevents stale state on token refresh or tab focus.

**`useLoginForm.ts` / `useSignupForm.ts`** — Extract all stateful logic from presentational components. Follows the "smart hook + dumb component" pattern.

**`AuthLayout.tsx`** — Eliminates the verbatim duplication of the two-column branded layout across Login and Signup.

**`ProtectedRoute.tsx`** — Guards authenticated routes. Shows a loading state while the session initialises (prevents flash-of-wrong-content and premature redirects).

**`VerifyEmail.tsx`** — Fixes the critical flow issue where unverified users were sent directly to `/feed`.

**`EmailVerified.tsx`** — Handles the Supabase redirect after email confirmation. Listens to `onAuthStateChange` rather than parsing URL hash tokens directly.

---

## 3. Architectural Decisions

### react-hook-form + Zod

**Decision:** Replace manual state + validation with `react-hook-form` + `@hookform/resolvers/zod`.

**Rationale:**
- `react-hook-form` uses uncontrolled inputs internally — no re-render on every keystroke.
- `zodResolver` gives us type-safe validation with a single schema that serves both runtime validation and TypeScript inference.
- `mode: "onBlur"` + `reValidateMode: "onChange"` gives the ideal UX: validate when the user leaves a field, then continuously as they fix it.
- Zod's `.transform()` handles normalisation (trim, lowercase email) in the same pipeline as validation.

### Feature-First Folder Structure

**Decision:** `src/features/auth/` with sub-folders `{components, hooks, services, schemas, utils, types}`.

**Rationale:** Features are self-contained. If auth were extracted to a package or replaced, the entire feature folder moves without touching the rest of the app. This also makes the public API explicit via `index.ts`.

### Service Layer (authService.ts)

**Decision:** All Supabase calls go through `authService`, never directly from components or hooks.

**Rationale:** Decouples UI from the auth provider. If Supabase were replaced with Auth0 or a custom backend, only `authService.ts` changes. The rest of the app is unaffected.

### Email Verification Flow

**Decision:** After signup, navigate to `/auth/verify-email` (not `/feed`).

**Rationale:** Supabase by default (when email confirmation is enabled) creates the user but does not sign them in until they verify. Sending them to `/feed` causes confusing partial-auth states. The verification page gives clear guidance and a resend button.

### Error Enumeration Prevention

**Decision:** All "user already registered" errors map to the same message as signup success.

**Rationale:** If the error message differs from the success message, an attacker can enumerate which email addresses are registered by attempting signups.

### Client-Side Throttle

**Decision:** Implement `loginThrottle.ts` for client-side brute-force protection.

**Rationale:** This is defence-in-depth, not a primary control. It stops casual attacks from a single browser session and pairs with Supabase's own server-side rate limiting. The throttle is in-memory (clears on reload) to avoid localStorage attack surface.

---

## 4. Final Security Audit

| Check | Status | Notes |
|---|---|---|
| Account enumeration prevention | ✅ | Duplicate-email errors map to generic success-like message |
| Raw backend errors exposed | ✅ Fixed | All errors through `mapAuthError()` |
| Brute-force protection | ✅ | Client-side throttle + Supabase server-side rate limiting |
| Unverified users in app | ✅ Fixed | Navigate to verify-email, not /feed |
| Verification redirect safety | ✅ | `emailRedirectTo` uses controlled origin constant, not user input |
| Protected routes | ✅ | `ProtectedRoute` guards all authenticated pages |
| Session initialisation | ✅ | `useAuth` hook waits for `getSession()` before rendering |
| Expired session handling | ✅ | `onAuthStateChange` fires on token refresh failure |
| Token exposure | ✅ | SDK manages tokens; we never handle JWT directly |
| XSS via user input | ✅ | React escapes all text by default; no `dangerouslySetInnerHTML` |
| Metadata sanitisation | ✅ | Trimmed + length-capped before Supabase call |
| Insecure redirect | ✅ | `intendedDestination` comes from router state (internal), not URL params |
| Credential logging | ✅ | Internal `mapAuthError` logs to console only in development |
| Password strength enforcement | ✅ | Zod schema + visual meter + Supabase server-side policy |

---

## 5. Final Checklist

✅ **Authentication works correctly** — `useAuth` + `onAuthStateChange` provides reactive session state  
✅ **Signup works correctly** — `signupWithEmail()` in `authService`, validated by `signupSchema`  
✅ **Login works correctly** — `loginWithEmail()` with throttle checks and generic error messages  
✅ **Email verification works correctly** — `VerifyEmail` holding page + `EmailVerified` confirmation page  
✅ **Route protection works correctly** — `ProtectedRoute` wraps all authenticated routes in `App.tsx`  
✅ **Validation works correctly** — Zod schemas with onBlur + onChange, proper error IDs and aria-describedby  
✅ **Accessibility requirements met** — role="alert", aria-live, aria-busy, aria-invalid, aria-required, aria-describedby, aria-label on forms, SR-only required indicators, password toggle with aria-pressed  
✅ **Error handling is robust** — Centralised `mapAuthError`, generic messages, internal logging, network failure messages, toast deduplication via 3-visible limit  
✅ **Security improvements implemented** — enumeration prevention, throttle, session guards, metadata sanitisation, no raw error exposure  
✅ **No existing functionality broken** — Login/Signup UI and branding are preserved; only the internals changed  
✅ **Code is production-ready** — Strict TypeScript, no `any`, small focused functions, reusable utilities, consistent patterns  
