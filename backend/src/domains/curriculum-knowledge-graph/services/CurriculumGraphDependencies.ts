// Curriculum Knowledge Graph — Clock and IdGenerator contracts + fixed implementations

export interface Clock {
  now(): string;
}

export class FixedClock implements Clock {
  constructor(private fixedTime: string) {}
  now(): string {
    return this.fixedTime;
  }
  setTime(t: string): void {
    this.fixedTime = t;
  }
}

export interface IdGenerator {
  generate(): string;
}

export class DeterministicIdGenerator implements IdGenerator {
  private counter = 0;
  constructor(private prefix: string = 'id') {}
  generate(): string {
    return `${this.prefix}-${++this.counter}`;
  }
  reset(): void {
    this.counter = 0;
  }
  setPrefix(p: string): void {
    this.prefix = p;
  }
}
