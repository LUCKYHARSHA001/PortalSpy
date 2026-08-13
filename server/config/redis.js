import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log(`✅ Redis connected at ${redisHost}:${redisPort}`);
});

redisClient.on('error', (err) => {
  console.warn(`⚠️ Redis Connection Alert: ${err.message}`);
});
