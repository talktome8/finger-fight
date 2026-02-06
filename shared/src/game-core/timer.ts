// ─── Game Timer ───────────────────────────────────────────
// Framework-agnostic timer with callbacks

export interface TimerCallbacks {
  onTick: (remaining: number) => void;
  onComplete: () => void;
}

export class GameTimer {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;
  private duration = 0;
  private tickInterval = 100; // ms

  start(durationSeconds: number, callbacks: TimerCallbacks): void {
    this.stop();
    this.duration = durationSeconds * 1000;
    this.startTime = Date.now();

    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.duration - elapsed);
      callbacks.onTick(remaining / 1000);
    }, this.tickInterval);

    this.timeoutId = setTimeout(() => {
      this.stop();
      callbacks.onComplete();
    }, this.duration);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  getElapsed(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  getRemaining(): number {
    if (!this.startTime) return 0;
    return Math.max(0, (this.duration - (Date.now() - this.startTime)) / 1000);
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Countdown timer (3, 2, 1, GO!)
export class CountdownTimer {
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];

  start(
    seconds: number,
    onCount: (count: number) => void,
    onComplete: () => void
  ): void {
    this.stop();

    for (let i = seconds; i >= 1; i--) {
      const delay = (seconds - i) * 1000;
      this.timeoutIds.push(
        setTimeout(() => onCount(i), delay)
      );
    }

    this.timeoutIds.push(
      setTimeout(() => {
        onComplete();
      }, seconds * 1000)
    );
  }

  stop(): void {
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
  }
}
