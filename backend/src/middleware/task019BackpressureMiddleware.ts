import { Request, Response, NextFunction } from 'express';
import { BackendBackpressureService, createSafeBackpressureMessage } from '../services/backendBackpressureService';
import { logger } from '../utils/logger';
import type { BackpressureConfig, BackpressureState, BackpressureResult } from '../contracts/task019Contracts';

const DEFAULT_CONFIG: BackpressureConfig = {
  maxConcurrent: 100,
  maxQueueDepth: 200,
  rejectionSampleSize: 50,
  cooldownThreshold: 0.5
};

const service = new BackendBackpressureService(DEFAULT_CONFIG.maxConcurrent);
let queueDepth = 0;

export function getBackpressureService(): BackendBackpressureService {
  return service;
}

export function getBackpressureState(): BackpressureState {
  const rejectionRate = service.getRejectionRate();
  const activeCount = service.getActiveCount();
  return {
    activeCount,
    maxConcurrent: service.getMaxConcurrent(),
    queueDepth,
    rejectionRate,
    isUnderPressure: activeCount >= service.getMaxConcurrent() || rejectionRate >= DEFAULT_CONFIG.cooldownThreshold,
    isCoolingDown: rejectionRate >= DEFAULT_CONFIG.cooldownThreshold
  };
}

export function backpressureMiddleware(req: Request, res: Response, next: NextFunction): void {
  const state = getBackpressureState();

  if (state.isUnderPressure && !state.isCoolingDown) {
    logger.warn({ activeCount: state.activeCount, maxConcurrent: state.maxConcurrent }, '[Backpressure] System under pressure — rejecting request');
    res.status(503).json({
      message: createSafeBackpressureMessage(),
      retryAfterMs: 5000,
      retryAfterSec: 5
    });
    return;
  }

  const token = service.acquire();
  if (!token) {
    queueDepth++;
    logger.warn({ activeCount: state.activeCount, queueDepth }, '[Backpressure] At capacity — rejecting request');

    setTimeout(() => {
      if (queueDepth > 0) queueDepth--;
    }, 1000);

    res.status(503).json({
      message: createSafeBackpressureMessage(),
      retryAfterMs: 2000,
      retryAfterSec: 2
    });
    return;
  }

  const originalEnd = res.end.bind(res);
  res.end = function (this: Response, ...args: any[]) {
    token.release();
    if (queueDepth > 0) queueDepth--;
    return originalEnd(...args);
  } as Response['end'];

  next();
}

export function resetBackpressure(): void {
  service.reset();
  queueDepth = 0;
}

export function updateMaxConcurrent(max: number): void {
  service.setMaxConcurrent(max);
}
