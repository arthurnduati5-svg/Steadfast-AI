"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}
const schoolAuthMiddleware = async (req, res, next) => {
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
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
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
        // THE FIX: The database lookup has been removed.
        // The middleware now trusts that the route handler (e.g., getOrCreateStudentProfile)
        // will be responsible for handling the existence of a user profile.
        // 3. Attach user ID to the request object
        req.user = {
            id: userId
        };
        // 4. Pass control to the next handler
        next();
    }
    catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unexpected server error during authentication.'
        });
    }
};
exports.schoolAuthMiddleware = schoolAuthMiddleware;
//# sourceMappingURL=schoolAuthMiddleware.js.map