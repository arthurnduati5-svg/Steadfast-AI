import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import profileRoutes from './routes/profile';
import aiRoutes from './routes/ai';
import { schoolAuthMiddleware } from './middleware/schoolAuthMiddleware';
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const logger = pino({ name: 'steadfast-copilot-backend' });
app.use(cors());
app.use(express.json());
// Log incoming requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok', timestamp: new Date() });
});
app.use('/api', schoolAuthMiddleware, profileRoutes);
app.use('/api/copilot', schoolAuthMiddleware, aiRoutes);
// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(err, 'Unhandled application error');
    res.status(500).send({ message: 'An unexpected error occurred.' });
});
app.listen(PORT, HOST, () => {
    logger.info(`Server trying to listen on ${HOST}:${PORT}`);
});
//# sourceMappingURL=index.js.map