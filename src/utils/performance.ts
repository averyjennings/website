/**
 * Performance utility functions for optimizing event handlers and rendering
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= wait) {
      lastCallTime = now;
      func(...args);
    } else if (!timeoutId) {
      const remainingTime = wait - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
        timeoutId = null;
      }, remainingTime);
    }
  };
}

/**
 * Request batching utility for aggregating multiple requests into a single batch
 */
export class RequestBatcher<T> {
  private batch: T[] = [];
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private processing = false;

  constructor(
    private processBatch: (items: T[]) => Promise<void>,
    private batchSize: number = 50,
    private maxWaitTime: number = 100
  ) {}

  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }

  async flush(): Promise<void> {
    if (this.processing || this.batch.length === 0) return;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.processing = true;
    const itemsToProcess = [...this.batch];
    this.batch = [];

    try {
      await this.processBatch(itemsToProcess);
    } finally {
      this.processing = false;
    }
  }

  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.batch = [];
  }
}

/**
 * RAF (RequestAnimationFrame) scheduler for optimizing canvas rendering
 */
export class RAFScheduler {
  private rafId: number | null = null;
  private tasks: Map<string, () => void> = new Map();

  schedule(taskId: string, task: () => void): void {
    this.tasks.set(taskId, task);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.runTasks();
      });
    }
  }

  cancel(taskId: string): void {
    this.tasks.delete(taskId);
  }

  private runTasks(): void {
    const tasksToRun = Array.from(this.tasks.values());
    this.tasks.clear();
    this.rafId = null;

    tasksToRun.forEach(task => task());
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.tasks.clear();
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`No mark found for ${startMark}`);
      return 0;
    }

    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}