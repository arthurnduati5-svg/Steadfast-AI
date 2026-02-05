import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import { schoolAuthMiddleware } from './middleware/schoolAuthMiddleware';
import { logger, httpLogger } from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';

// 🛡️ SECURITY MIDDLEWARE
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // Restricted in production
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
app.use(express.json());
app.use(httpLogger); // Structured logging

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

app.use('/api', schoolAuthMiddleware, profileRoutes);
app.use('/api/copilot', schoolAuthMiddleware, aiRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled application error');
  res.status(500).send({ message: 'An unexpected error occurred.' });
});

const server = app.listen(PORT, HOST, () => {
  logger.info(`Server listening on ${HOST}:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);

  // Force the process to stay alive
  process.stdin.resume();

  // Keep-alive heartbeat
  setInterval(() => {
    logger.debug('[Keep-Alive] Server is healthy');
  }, 60000);
});

// ⚡ SERVER CONFIGURATION
server.timeout = 300000;
server.keepAliveTimeout = 300000;
server.headersTimeout = 301000;

// 🛑 GRACEFUL SHUTDOWN
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));