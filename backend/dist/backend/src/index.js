"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const profile_1 = __importDefault(require("./routes/profile"));
const ai_1 = __importDefault(require("./routes/ai"));
const voice_1 = __importDefault(require("./routes/voice"));
const latency_1 = __importDefault(require("./routes/latency"));
const anomalies_1 = __importDefault(require("./routes/anomalies"));
const schoolAuthMiddleware_1 = require("./middleware/schoolAuthMiddleware");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
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
const globalSignalBridge = globalThis;
if (!globalSignalBridge.__steadfastSignalBridge) {
    globalSignalBridge.__steadfastSignalBridge = { installed: false };
}
app.disable('x-powered-by');
app.set('trust proxy', 1);
// 🛡️ SECURITY MIDDLEWARE
app.use((0, helmet_1.default)()); // Sets various HTTP headers for security
app.use((0, cors_1.default)({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// 📉 GLOBAL RATE LIMITING
// NOTE: Schools often share one public IP. 
// We set a high threshold (10,000 req / 15 min) to prevent blocking whole schools,
// while still providing protection against brute-force/DDoS attempts.
const globalLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Allow high volume for NAT environments
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Server is under heavy load. Please try again later.' }
});
app.use(globalLimiter);
app.use(express_1.default.json({ limit: JSON_LIMIT }));
app.use(express_1.default.urlencoded({ extended: false, limit: JSON_LIMIT }));
app.use(logger_1.httpLogger); // Structured logging
app.get('/api/health', (req, res) => {
    res.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSec: Math.round(process.uptime()),
        env: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || 'unknown',
    });
});
app.use('/api/copilot/latency', schoolAuthMiddleware_1.schoolAuthMiddleware, latency_1.default);
app.use('/api/copilot/anomalies', schoolAuthMiddleware_1.schoolAuthMiddleware, anomalies_1.default);
app.use('/api/copilot', schoolAuthMiddleware_1.schoolAuthMiddleware, ai_1.default);
app.use('/api/voice', schoolAuthMiddleware_1.schoolAuthMiddleware, voice_1.default);
app.use('/api', schoolAuthMiddleware_1.schoolAuthMiddleware, profile_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    logger_1.logger.error({ err, url: req.url, method: req.method }, 'Unhandled application error');
    const status = Number(err?.status || err?.statusCode || 500);
    if (status === 413) {
        res.status(413).send({ message: `Request payload too large. Increase JSON_LIMIT or upload fewer/smaller files.` });
        return;
    }
    res.status(status >= 400 && status < 600 ? status : 500).send({ message: 'An unexpected error occurred.' });
});
const server = app.listen(PORT, HOST, () => {
    if (!allowAllOrigins && allowedOrigins.length === 0) {
        logger_1.logger.error('ALLOWED_ORIGINS is empty in production. Cross-origin requests are blocked until it is configured.');
    }
    logger_1.logger.info(`Server listening on ${HOST}:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
});
// ⚡ SERVER CONFIGURATION
server.requestTimeout = REQUEST_TIMEOUT_MS;
server.timeout = REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = HEADERS_TIMEOUT_MS;
// 🛑 GRACEFUL SHUTDOWN
const shutdown = (signal) => {
    logger_1.logger.info(`${signal} received. Shutting down gracefully...`);
    server.closeIdleConnections?.();
    server.close(() => {
        logger_1.logger.info('HTTP server closed.');
        process.exit(0);
    });
    // Force shutdown after 10s
    setTimeout(() => {
        logger_1.logger.error('Could not close connections in time, forcefully shutting down');
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
//# sourceMappingURL=index.js.map