import { randomUUID } from 'node:crypto'
import { Request, Response, NextFunction } from 'express'

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const existing = req.headers['x-request-id'] as string | undefined
  ;(req as any).requestId = existing || randomUUID()
  if (!existing) {
    ;(req as any).generatedRequestId = true
  }
  next()
}

export function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown'
}
