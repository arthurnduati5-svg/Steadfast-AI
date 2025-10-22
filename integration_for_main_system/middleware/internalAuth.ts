
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to protect internal API endpoints.
 * 
 * It checks for the 'x-internal-api-key' header and validates it against
 * the key stored in the environment variables. This ensures that only trusted
 * servers (like the AI Backend) can access the endpoint.
 */
export const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-internal-api-key'];
  const expectedApiKey = process.env.INTERNAL_API_KEY;

  if (!expectedApiKey) {
    // This is a server configuration error, so we log it.
    console.error('CRITICAL: INTERNAL_API_KEY is not configured on the server.');
    return res.status(500).json({ message: 'Internal Server Configuration Error.' });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    // This is an authentication failure.
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // The key is valid, proceed to the actual route handler.
  next();
};
