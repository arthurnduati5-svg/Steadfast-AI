import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}
export const schoolAuthMiddleware = async (req, res, next) => {
    console.log(`[AuthMiddleware] - Incoming request for: ${req.method} ${req.originalUrl}`);
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn(`[AuthMiddleware] - No token or invalid format for ${req.originalUrl}`);
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided or invalid format.'
            });
        }
        const token = authHeader.split(' ')[1];
        console.log(`[AuthMiddleware] - Token received, attempting verification for ${req.originalUrl}`);
        let decoded;
        try {
            // 1. Verify the JWT token
            decoded = jwt.verify(token, JWT_SECRET);
            console.log(`[AuthMiddleware] - Token successfully verified for ${req.originalUrl}. Decoded userId: ${decoded.userId}`);
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.warn(`[AuthMiddleware] - Token expired for ${req.originalUrl}`);
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please log in again.'
                });
            }
            console.error(`[AuthMiddleware] - Invalid token for ${req.originalUrl}:`, error.message);
            return res.status(401).json({
                success: false,
                message: 'Authentication failed. Invalid token.'
            });
        }
        // 2. Extract the user ID from the token payload
        const userId = decoded.userId;
        if (!userId) {
            console.warn(`[AuthMiddleware] - User ID not found in token payload for ${req.originalUrl}`);
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token payload.'
            });
        }
        // 3. Attach user ID to the request object
        req.user = {
            id: userId
        };
        // 4. Pass control to the next handler
        console.log(`[AuthMiddleware] - Calling next() for ${req.originalUrl}`);
        next();
    }
    catch (error) {
        console.error(`[AuthMiddleware] - Unexpected authentication error for ${req.originalUrl}:`, error.message);
        return res.status(500).json({
            success: false,
            message: 'Unexpected server error during authentication.'
        });
    }
};
//# sourceMappingURL=schoolAuthMiddleware.js.map