import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

/**
 * Generates a standard JWT for a given student ID.
 * This token is sent to the frontend and used to authenticate with the AI Backend.
 * @param {string} userId - The unique ID of the student from the database.
 * @returns {string} The generated JSON Web Token.
 */
export const generateAuthToken = (userId: string): string => {
  const payload = {
    userId: userId,
  };

  // The token is signed with the shared secret and will expire in 1 day.
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d',
  });

  return token;
};
