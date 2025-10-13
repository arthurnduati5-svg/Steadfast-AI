import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chatRoutes';
// import authExchangeRoutes from './routes/auth';
import { schoolAuthMiddleware } from './middleware/schoolAuthMiddleware'; // Import our new middleware

const app = express();
const PORT = process.env.PORT || 8080;

// Logger
const logger = pino({ name: 'steadfast-copilot-backend' });

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// --- Public Authentication Route ---
// This route is for exchanging the school's token for our backend token.
// It is NOT protected by the auth middleware.
// app.use('/api/auth', authExchangeRoutes);


// --- Protected API Routes ---
// All routes below this point are now protected by our schoolAuthMiddleware.
// Any request to these endpoints MUST include a valid "Bearer [backendToken]".
app.use('/api', schoolAuthMiddleware, profileRoutes);
app.use('/api/ai', schoolAuthMiddleware, aiRoutes);
// Note: The middleware is applied to the '/api/ai' path, so it covers both `aiRoutes` and `chatRoutes`.
// Applying it to `chatRoutes` again is redundant but harmless.
app.use('/api/ai', schoolAuthMiddleware, chatRoutes);


// Health Check Route (Public)
app.get('/api/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err, 'Unhandled application error');
  res.status(500).send({ message: 'An unexpected error occurred.' });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
