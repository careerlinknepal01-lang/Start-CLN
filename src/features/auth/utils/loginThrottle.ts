const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000;

type AttemptRecord = {
  count: number;
  lockedUntil: number;
  lockoutLevel: number;
};

const store = new Map<string, AttemptRecord>();

function getRecord(email: string): AttemptRecord {
  return store.get(email) ?? { count: 0, lockedUntil: 0, lockoutLevel: 0 };
}

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

export function recordFailedAttempt(email: string): void {
  const record = getRecord(email);
  const now = Date.now();

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

export function clearAttempts(email: string): void {
  store.delete(email);
}

export function formatLockoutTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  if (seconds === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${seconds !== 1 ? "s" : ""}`;
}

export function getRemainingAttempts(email: string): number {
  const record = getRecord(email);
  return Math.max(0, MAX_ATTEMPTS - record.count);
}
