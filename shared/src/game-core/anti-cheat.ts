import type { TapEvent } from '../types/messages.js';

// ─── Anti-Cheat Validation ────────────────────────────────
// Framework-agnostic, runs on both client and server

export interface AntiCheatConfig {
  maxTapsPerSecond: number;
  maxFingers: number;
  minTapInterval: number; // ms between taps from same finger
  maxBurstSize: number;   // max taps in 100ms window
  burstWindowMs: number;
}

export const DEFAULT_ANTI_CHEAT: AntiCheatConfig = {
  maxTapsPerSecond: 20,
  maxFingers: 4,
  minTapInterval: 30,
  maxBurstSize: 5,
  burstWindowMs: 100,
};

export interface ValidationResult {
  validTaps: TapEvent[];
  rejectedTaps: TapEvent[];
  reasons: string[];
}

export function validateTaps(
  taps: TapEvent[],
  config: AntiCheatConfig = DEFAULT_ANTI_CHEAT
): ValidationResult {
  const valid: TapEvent[] = [];
  const rejected: TapEvent[] = [];
  const reasons: string[] = [];

  if (taps.length === 0) {
    return { validTaps: [], rejectedTaps: [], reasons: [] };
  }

  // Sort by timestamp
  const sorted = [...taps].sort((a, b) => a.timestamp - b.timestamp);

  // Check total rate
  const duration = (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 1000;
  if (duration > 0) {
    const rate = sorted.length / duration;
    if (rate > config.maxTapsPerSecond * 1.5) {
      reasons.push(`Excessive tap rate: ${rate.toFixed(1)}/s`);
      // Still process individually but flag
    }
  }

  // Group by finger
  const byFinger = new Map<number, TapEvent[]>();
  for (const tap of sorted) {
    const fingerId = Math.min(tap.fingerId, config.maxFingers - 1);
    if (!byFinger.has(fingerId)) byFinger.set(fingerId, []);
    byFinger.get(fingerId)!.push(tap);
  }

  // Check unique finger count
  if (byFinger.size > config.maxFingers) {
    reasons.push(`Too many fingers: ${byFinger.size}`);
  }

  // Validate individual taps
  for (const tap of sorted) {
    let isValid = true;

    // Check finger ID range
    if (tap.fingerId >= config.maxFingers) {
      isValid = false;
      reasons.push(`Invalid finger ID: ${tap.fingerId}`);
    }

    // Check interval from same finger
    const fingerTaps = byFinger.get(tap.fingerId) || [];
    const tapIndex = fingerTaps.indexOf(tap);
    if (tapIndex > 0) {
      const interval = tap.timestamp - fingerTaps[tapIndex - 1].timestamp;
      if (interval < config.minTapInterval) {
        isValid = false;
      }
    }

    // Check burst (too many taps in small window)
    const burstStart = tap.timestamp - config.burstWindowMs;
    const tapsInBurst = sorted.filter(
      (t) => t.timestamp >= burstStart && t.timestamp <= tap.timestamp
    ).length;
    if (tapsInBurst > config.maxBurstSize) {
      isValid = false;
    }

    if (isValid) {
      valid.push(tap);
    } else {
      rejected.push(tap);
    }
  }

  return { validTaps: valid, rejectedTaps: rejected, reasons };
}

// Rate limiter for server-side message validation
export class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const times = this.timestamps.get(key) || [];
    const recent = times.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      return false;
    }

    recent.push(now);
    this.timestamps.set(key, recent);
    return true;
  }

  reset(key: string): void {
    this.timestamps.delete(key);
  }
}
