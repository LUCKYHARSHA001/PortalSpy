import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const isTls = process.env.REDIS_TLS === 'true' || redisHost.includes('upstash.io');

export const redisOptions = process.env.REDIS_URL
  ? {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    }
  : {
      host: redisHost,
      port: redisPort,
      ...(redisPassword && { password: redisPassword }),
      ...(isTls && { tls: {} }),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

export const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log(`✅ Redis connected successfully`);
});

redisClient.on('error', (err) => {
  console.warn(`⚠️ Redis Connection Alert: ${err.message}`);
});

