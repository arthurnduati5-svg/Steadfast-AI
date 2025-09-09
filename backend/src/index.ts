// backend/src/index.ts

import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes';
import prisma from './utils/prismaClient';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware --- //

// Enable CORS for all routes
// You might want to restrict this to specific origins in a production environment.
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// --- API Routes --- //

// Mount the chat routes under /api
app.use('/api', chatRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'AI Chat Backend is running!' });
});

// --- Server Start --- //

async function startServer() {
  try {
    // Connect to the database (Prisma handles connection pooling)
    await prisma.$connect();
    console.log('Connected to the database successfully!');

    app.listen(PORT, () => {
      console.log(`AI Chat Backend server listening on port ${PORT}`);
      console.log(`Access at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  console.log('Disconnected from database.');
  // Add any other cleanup here
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  console.log('Disconnected from database.');
  // Add any other cleanup here
  process.exit(0);
});
