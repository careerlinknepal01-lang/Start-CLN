// ─── Client-Side Login Throttle ───────────────────────────────────────────────
// SECURITY NOTE: Client-side throttling is a UX layer only.
// True rate limiting must be enforced server-side (Supabase edge functions /
// API gateway / WAF). This module:
//  1. Tracks failed attempts per email in memory (cleared on page reload).
//  2. Imposes an exponential backoff lockout period after N failures.
//  3. Provides hooks for future CAPTCHA integration.
//
// This does NOT prevent a determined attacker who controls the client, but it:
//  • Stops casual brute-force from a single browser session.
//  • Gives users clear feedback so they don't think the app is broken.
//  • Pairs with Supabase's own rate limiting for defence in depth.

const MAX_ATTEMPTS  = 5;
const BASE_LOCKOUT_MS = 30_000; // 30 seconds for first lockout

type AttemptRecord = {
  count: number;
  lockedUntil: number; // epoch ms, 0 if not locked
  lockoutLevel: number; // escalates with each lockout
};

// In-memory store (per browser session). For persistent throttling across
// reloads, migrate this to sessionStorage or a server-side solution.
const store = new Map<string, AttemptRecord>();

function getRecord(email: string): AttemptRecord {
  return store.get(email) ?? { count: 0, lockedUntil: 0, lockoutLevel: 0 };
}

/**
 * Check whether this email is currently throttled.
 * @returns { throttled: false } or { throttled: true, remainingMs: number }
 */
export function checkThrottle(
  email: string
): { throttled: false } | { throttled: true; remainingMs: number } {
  const record = getRecord(email);
  const now = Date.now();

  if (record.lockedUntil > now) {
    return { throttled: true, remainingMs: record.lockedUntil - now };
  }

  return { throttled: false };
}

/**
 * Record a failed login attempt. Escalates lockout if threshold is reached.
 */
export function recordFailedAttempt(email: string): void {
  const record = getRecord(email);
  const now = Date.now();

  // If a previous lockout has expired, reset the count but increment level
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    store.set(email, {
      count: 1,
      lockedUntil: 0,
      lockoutLevel: record.lockoutLevel + 1,
    });
    return;
  }

  const newCount = record.count + 1;

  if (newCount >= MAX_ATTEMPTS) {
    // Exponential back-off: 30s, 60s, 120s, … up to 15 min
    const lockoutMs = Math.min(
      BASE_LOCKOUT_MS * Math.pow(2, record.lockoutLevel),
      15 * 60 * 1000
    );
    store.set(email, {
      count: newCount,
      lockedUntil: now + lockoutMs,
      lockoutLevel: record.lockoutLevel,
    });
  } else {
    store.set(email, { ...record, count: newCount });
  }
}

/**
 * Clear the attempt counter on successful login.
 */
export function clearAttempts(email: string): void {
  store.delete(email);
}

/**
 * Format remaining lockout time for display.
 * e.g. "1 minute 30 seconds"
 */
export function formatLockoutTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  if (seconds === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${seconds !== 1 ? "s" : ""}`;
}

/**
 * How many attempts remain before lockout?
 */
export function getRemainingAttempts(email: string): number {
  const record = getRecord(email);
  return Math.max(0, MAX_ATTEMPTS - record.count);
}
