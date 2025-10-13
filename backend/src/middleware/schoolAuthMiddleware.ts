// backend/src/middleware/schoolAuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient'; // Use our singleton prisma client

// Extend the Express Request type to include our custom 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        // We can add other properties like name, email if needed
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export const schoolAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided or invalid format.'
      });
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      // 1. Verify the JWT token
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string }; // Assuming payload has { userId: '...' }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Invalid token.'
      });
    }

    // 2. Extract the user ID from the token payload
    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token payload.'
      });
    }

    // 3. Lookup student profile by userId in our AI backend's database
    // This replaces the 'user' lookup from your original code.
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: userId },
      select: {
        userId: true, // We only need the ID for now
      }
    });

    if (!studentProfile) {
      return res.status(401).json({
        success: false,
        message: 'Student profile not found or token invalid.'
      });
    }

    // NOTE: The checks for user 'status' ('suspended', 'pending-completion') and 'role' from
    // your original code have been removed because these fields do not exist on our
    // StudentProfile model. If you need this functionality, we will need to add these
    // fields to the 'StudentProfile' schema in 'backend/prisma/schema.prisma'.

    // 4. Attach user information to the request object
    req.user = {
      id: studentProfile.userId
    };
    
    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unexpected server error during authentication.'
    });
  }
};
