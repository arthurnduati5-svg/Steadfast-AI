"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pino_1 = __importDefault(require("pino"));
const profile_1 = __importDefault(require("./routes/profile"));
const ai_1 = __importDefault(require("./routes/ai"));
// import authExchangeRoutes from './routes/auth'; // Commented out this line again
const schoolAuthMiddleware_1 = require("./middleware/schoolAuthMiddleware"); // Import our new middleware
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8080', 10); // Parse PORT to a number
const HOST = '0.0.0.0'; // Explicitly set host to 0.0.0.0
// Logger
const logger = (0, pino_1.default)({ name: 'steadfast-copilot-backend' });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
// --- Public Authentication Route ---
// This route is for exchanging the school's token for our backend token.
// It is NOT protected by the auth middleware.
// app.use('/api/auth', authExchangeRoutes); // Commented out this line again
// Health Check Route (Public)
app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok', timestamp: new Date() });
});
// --- Protected API Routes ---
// All routes below this point are now protected by our schoolAuthMiddleware.
// Any request to these endpoints MUST include a valid "Bearer [backendToken]".
app.use('/api', schoolAuthMiddleware_1.schoolAuthMiddleware, profile_1.default);
app.use('/api/ai', schoolAuthMiddleware_1.schoolAuthMiddleware, ai_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(err, 'Unhandled application error');
    res.status(500).send({ message: 'An unexpected error occurred.' });
});
// Start the server
app.listen(PORT, HOST, () => {
    logger.info(`Server trying to listen on ${HOST}:${PORT}`);
});
//# sourceMappingURL=index.js.map