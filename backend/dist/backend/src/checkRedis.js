import { createClient } from 'redis';
import 'dotenv/config';
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
    console.error('REDIS_URL environment variable is not set. Please set it to connect to Redis.');
    process.exit(1);
}
async function checkRedis() {
    const client = createClient({
        url: REDIS_URL,
    });
    client.on('error', (err) => console.error('Redis Client Error', err));
    try {
        await client.connect();
        console.log('Successfully connected to Redis.');
        const pong = await client.ping();
        console.log(`Redis PING response: ${pong}`);
        await client.disconnect();
        console.log('Redis client disconnected.');
        process.exit(0);
    }
    catch (err) {
        console.error('Failed to connect or ping Redis:', err);
        await client.disconnect();
        process.exit(1);
    }
}
checkRedis();
//# sourceMappingURL=checkRedis.js.map