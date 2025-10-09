import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chatRoutes'; // Import the new chat routes

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

// Routes
app.use('/api', profileRoutes);
app.use('/api/ai', aiRoutes); // Keep the existing AI routes for memory, etc.
app.use('/api/ai', chatRoutes); // Add the new, refactored chat routes

// Health Check Route
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
