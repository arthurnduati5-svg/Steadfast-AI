export class BackendBackpressureService {
  private activeCount = 0;
  private maxConcurrent: number;
  private rejectionCount = 0;
  private totalAttempts = 0;

  constructor(maxConcurrent = 100) {
    this.maxConcurrent = maxConcurrent;
  }

  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
  }

  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getRejectionCount(): number {
    return this.rejectionCount;
  }

  getTotalAttempts(): number {
    return this.totalAttempts;
  }

  getRejectionRate(): number {
    if (this.totalAttempts === 0) return 0;
    return this.rejectionCount / this.totalAttempts;
  }

  canAccept(): boolean {
    this.totalAttempts++;
    return this.activeCount < this.maxConcurrent;
  }

  acquire(): BackpressureToken | null {
    if (!this.canAccept()) {
      this.rejectionCount++;
      return null;
    }
    this.activeCount++;
    return new BackpressureToken(this);
  }

  release(): void {
    if (this.activeCount > 0) {
      this.activeCount--;
    }
  }

  reset(): void {
    this.activeCount = 0;
    this.rejectionCount = 0;
    this.totalAttempts = 0;
  }
}

export class BackpressureToken {
  private released = false;

  constructor(private service: BackendBackpressureService) {}

  release(): void {
    if (!this.released) {
      this.released = true;
      this.service.release();
    }
  }
}

export function createSafeBackpressureMessage(): string {
  return 'The system is currently experiencing high demand. Please try again shortly.';
}
