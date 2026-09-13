import { Request, Response, NextFunction } from 'express';
import { checkMultiTenantLimit } from '../services/task019MultiTenantRateLimitService';
import { checkAbuse } from '../services/task019AbuseDetectionService';
import { backpressureMiddleware } from './task019BackpressureMiddleware';
import { logger } from '../utils/logger';
import type {
  RateLimitMiddlewareOptions,
  RateLimitMiddlewareResult
} from '../contracts/task019Contracts';

const DEFAULT_OPTIONS: RateLimitMiddlewareOptions = {
  enabled: true,
  useBackpressure: true,
  useAbuseDetection: true,
  useQuotas: true,
  useMultiTenant: true,
  failOpen: true
};

const optionsStore = new Map<string, RateLimitMiddlewareOptions>();

export function configureRouteRateLimit(
  route: string,
  opts: Partial<RateLimitMiddlewareOptions>
): void {
  const existing = optionsStore.get(route) || { ...DEFAULT_OPTIONS };
  optionsStore.set(route, { ...existing, ...opts });
}

export function getRateLimitOptions(route: string): RateLimitMiddlewareOptions {
  const routeOpts = optionsStore.get(route);
  if (routeOpts) return routeOpts;

  if (route.startsWith('/api/health') || route.startsWith('/api/ops')) {
    return { ...DEFAULT_OPTIONS, useBackpressure: false, useAbuseDetection: false, useQuotas: false, useMultiTenant: false };
  }

  return { ...DEFAULT_OPTIONS };
}

export async function checkRateLimit(
  req: Request,
  _res: Response
): Promise<RateLimitMiddlewareResult> {
  const route = req.route?.path || req.path || req.originalUrl || '/unknown';
  const opts = getRateLimitOptions(route);

  if (!opts.enabled) {
    return { passed: true, statusCode: 200, headers: {}, body: {}, retryAfterMs: 0 };
  }

  const studentId = (req as any).user?.id;
  const schoolId = (req as any).schoolId;
  const role = (req as any).user?.role;
  const method = req.method;

  try {
    if (opts.useAbuseDetection && studentId) {
      const abuseResult = await checkAbuse(studentId, route, method);
      if (abuseResult.isAbusive && abuseResult.recommendedAction === 'block') {
        const headers: Record<string, string | number> = {
          'Retry-After': Math.ceil(abuseResult.cooldownRemainingMs / 1000),
          'X-RateLimit-Abuse': 'true'
        };
        return {
          passed: false,
          statusCode: 429,
          headers,
          body: {
            message: 'Too many requests. Please slow down.',
            retryAfterMs: abuseResult.cooldownRemainingMs,
            retryAfterSec: Math.ceil(abuseResult.cooldownRemainingMs / 1000)
          },
          retryAfterMs: abuseResult.cooldownRemainingMs
        };
      }
      if (abuseResult.isAbusive && abuseResult.recommendedAction === 'degrade') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (opts.useMultiTenant && studentId) {
      const limitResult = await checkMultiTenantLimit(studentId, schoolId, method, route, role);
      if (!limitResult.allowed) {
        const retryAfterMs = 60000;
        const headers: Record<string, string | number> = {
          'Retry-After': Math.ceil(retryAfterMs / 1000),
          'X-RateLimit-Student-Remaining': limitResult.studentRemaining,
          'X-RateLimit-School-Remaining': limitResult.schoolRemaining
        };
        return {
          passed: false,
          statusCode: 429,
          headers,
          body: {
            message: limitResult.reason || 'Rate limit exceeded. Please reduce request frequency.',
            retryAfterMs,
            retryAfterSec: Math.ceil(retryAfterMs / 1000)
          },
          retryAfterMs
        };
      }
    }

    return { passed: true, statusCode: 200, headers: {}, body: {}, retryAfterMs: 0 };
  } catch (err) {
    if (opts.failOpen) {
      logger.error({ err, route }, '[RateLimitMiddleware] Error — allowing request (fail-open)');
      return { passed: true, statusCode: 200, headers: {}, body: {}, retryAfterMs: 0 };
    }
    throw err;
  }
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') return next();

  const route = req.route?.path || req.path || req.originalUrl || '/unknown';
  const opts = getRateLimitOptions(route);

  if (opts.useBackpressure) {
    return backpressureMiddleware(req, res, (err?: any) => {
      if (err) return next(err);
      checkRateLimit(req, res)
        .then(result => {
          if (!result.passed) {
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, value);
            }
            res.status(result.statusCode).json(result.body);
            return;
          }
          next();
        })
        .catch(next);
    });
  }

  checkRateLimit(req, res)
    .then(result => {
      if (!result.passed) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
        res.status(result.statusCode).json(result.body);
        return;
      }
      next();
    })
    .catch(next);
}

export function resetRateLimitConfig(): void {
  optionsStore.clear();
}
