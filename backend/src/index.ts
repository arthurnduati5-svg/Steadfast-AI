import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import voiceRoutes from './routes/voice';
import latencyRoutes from './routes/latency';
import anomalyRoutes from './routes/anomalies';
import { schoolAuthMiddleware } from './middleware/schoolAuthMiddleware';
import { logger, httpLogger } from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const JSON_LIMIT = process.env.JSON_LIMIT || '10mb';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10);
const KEEP_ALIVE_TIMEOUT_MS = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS || '65000', 10);
const HEADERS_TIMEOUT_MS = parseInt(process.env.HEADERS_TIMEOUT_MS || '66000', 10);
const rawAllowedOrigins = String(process.env.ALLOWED_ORIGINS || '').trim();
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.length === 0 && !isProduction;
const corsOrigin = allowAllOrigins ? true : allowedOrigins.length > 0 ? allowedOrigins : false;

type GlobalSignalBridge = {
  __steadfastSignalBridge?: {
    installed: boolean;
    dispatch?: (signal: string) => void;
  };
};

const globalSignalBridge = globalThis as typeof globalThis & GlobalSignalBridge;
if (!globalSignalBridge.__steadfastSignalBridge) {
  globalSignalBridge.__steadfastSignalBridge = { installed: false };
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

// 🛡️ SECURITY MIDDLEWARE
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📉 GLOBAL RATE LIMITING
// NOTE: Schools often share one public IP. 
// We set a high threshold (10,000 req / 15 min) to prevent blocking whole schools,
// while still providing protection against brute-force/DDoS attempts.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Allow high volume for NAT environments
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Server is under heavy load. Please try again later.' }
});

app.use(globalLimiter);
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: JSON_LIMIT }));
app.use(httpLogger); // Structured logging

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown',
  });
});

app.use('/api/copilot/latency', schoolAuthMiddleware, latencyRoutes);
app.use('/api/copilot/anomalies', schoolAuthMiddleware, anomalyRoutes);
app.use('/api/copilot', schoolAuthMiddleware, aiRoutes);
app.use('/api/voice', schoolAuthMiddleware, voiceRoutes);
app.use('/api', schoolAuthMiddleware, profileRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled application error');
  const status = Number(err?.status || err?.statusCode || 500);
  if (status === 413) {
    res.status(413).send({ message: `Request payload too large. Increase JSON_LIMIT or upload fewer/smaller files.` });
    return;
  }
  res.status(status >= 400 && status < 600 ? status : 500).send({ message: 'An unexpected error occurred.' });
});

const server = app.listen(PORT, HOST, () => {
  if (!allowAllOrigins && allowedOrigins.length === 0) {
    logger.error('ALLOWED_ORIGINS is empty in production. Cross-origin requests are blocked until it is configured.');
  }
  logger.info(`Server listening on ${HOST}:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
});

// ⚡ SERVER CONFIGURATION
server.requestTimeout = REQUEST_TIMEOUT_MS;
server.timeout = REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = HEADERS_TIMEOUT_MS;

// 🛑 GRACEFUL SHUTDOWN
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.closeIdleConnections?.();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    server.closeAllConnections?.();
    process.exit(1);
  }, 10000);
};

globalSignalBridge.__steadfastSignalBridge.dispatch = shutdown;
if (!globalSignalBridge.__steadfastSignalBridge.installed) {
  process.on('SIGTERM', () => globalSignalBridge.__steadfastSignalBridge?.dispatch?.('SIGTERM'));
  process.on('SIGINT', () => globalSignalBridge.__steadfastSignalBridge?.dispatch?.('SIGINT'));
  globalSignalBridge.__steadfastSignalBridge.installed = true;
}
