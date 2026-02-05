import pino from 'pino';

export const logger = pino({
    name: 'steadfast-backend',
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    base: {
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version
    }
});

export const httpLogger = (req: any, res: any, next: any) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        }, 'HTTP Request');
    });
    next();
};
