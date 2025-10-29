import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const MOCK_USER_ID = 'test-student-1';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'This endpoint is for development only.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Auth API] JWT_SECRET is not defined in the environment.');
    return res.status(500).json({ error: 'JWT secret is not configured on the server.' });
  }

  const payload = {
    userId: MOCK_USER_ID,
  };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  res.status(200).json({ token });
}
