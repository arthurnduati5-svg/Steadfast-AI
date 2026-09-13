/**
 * AI Route Shared Middleware — rate limiters, upload config, shared imports
 *
 * Extracted from backend/src/routes/ai.ts lines 186-233
 * to avoid duplication across domain route modules.
 */

import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../../middleware/schoolAuthMiddleware';
import { rateLimiter } from '../../middleware/rateLimiter';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';

export { Router, Request, Response, schoolAuthMiddleware, rateLimiter };

// ── AuthedRequest type ──
export type AuthedRequest = Request & { user?: any };

// ── Rate Limiters ──

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'AI processing limit reached. Please wait a minute.' },
  validate: { default: false }
});

export const sttLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'Too many voice-to-text requests. Please slow down.' },
  validate: { default: false }
});

export const ttsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'Too many text-to-voice requests. Please slow down.' },
  validate: { default: false }
});

// ── Upload Configuration ──

export const uploadDir = process.env.STEADFAST_UPLOAD_DIR
  ? path.resolve(process.env.STEADFAST_UPLOAD_DIR)
  : path.join(os.tmpdir(), 'steadfast-ai', 'uploads');

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = path
        .basename(file.originalname || 'audio.webm')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `audio-${Date.now()}-${safeOriginalName}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// ── Safe response helpers ──

export function sendError(res: Response, status: number, message: string, details?: Record<string, unknown>) {
  return res.status(status).send({ message, ...details });
}

export function send500(res: Response, error?: unknown) {
  return res.status(500).send({ message: 'Internal server error' });
}
