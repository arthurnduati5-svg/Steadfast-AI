// backend/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Extend the Request type to include studentId
declare global {
  namespace Express {
    interface Request {
      studentId?: string;
    }
  }
}

export const authenticateStudent = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required: Bearer token missing' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    // Verify the token locally using the shared secret
    const decoded = jwt.verify(token, jwtSecret) as { studentId: string; role: string; }; // Adjust type based on your JWT payload

    // Attach the studentId from the decoded token to the request object
    req.studentId = decoded.studentId;
    // In a real application, you might also check the role: if (decoded.role !== 'student') ...

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Authentication token expired.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};
