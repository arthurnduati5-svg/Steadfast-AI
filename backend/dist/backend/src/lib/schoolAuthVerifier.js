// backend/src/lib/schoolAuthVerifier.ts
import jwt from 'jsonwebtoken';
/**
 * Verifies a token from the school's primary authentication system.
 *
 * =================================================================================
 * ==================               IMPORTANT ACTION REQUIRED               ==================
 * =================================================================================
 *
 * This function now uses JWT for token verification. It expects a token signed
 * with the secret key defined in the `JWT_SECRET` environment variable.
 *
 * The JWT payload MUST contain a `userId` field.
 *
 * =================================================================================
 *
 * @param {string} token - The JWT authentication token.
 * @returns {Promise<string | null>} The unique user ID if the token is valid, otherwise null.
 */
export async function verifySchoolAuthToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('[SECURITY ERROR] JWT_SECRET is not defined in the environment variables. Cannot verify tokens.');
        return null;
    }
    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, secret);
        // Check if the payload has the required userId
        if (decoded && decoded.userId) {
            console.log(`Successfully verified token for userId: ${decoded.userId}`);
            return decoded.userId;
        }
        console.warn('JWT verification succeeded, but payload did not contain a userId.');
        return null;
    }
    catch (error) {
        console.error('JWT verification failed:', error.message);
        return null; // Token is invalid, expired, or malformed
    }
}
//# sourceMappingURL=schoolAuthVerifier.js.map