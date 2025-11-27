"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySchoolAuthToken = verifySchoolAuthToken;
// backend/src/lib/schoolAuthVerifier.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
async function verifySchoolAuthToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('[SECURITY ERROR] JWT_SECRET is not defined in the environment variables. Cannot verify tokens.');
        return null;
    }
    try {
        // Verify the token using the secret key
        const decoded = jsonwebtoken_1.default.verify(token, secret);
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