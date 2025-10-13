// src/config/redis.ts
import IORedis, { RedisOptions } from 'ioredis';

let client: IORedis | null = null;

export function getRedisClient(): IORedis {
  if (client) return client;

  const url = process.env.REDIS_URL?.trim();
  const baseOpts: RedisOptions = {
    maxRetriesPerRequest: null,   // tránh fail sớm khi handshake
    enableReadyCheck: true,
    connectTimeout: 15000,
    lazyConnect: false,
    enableOfflineQueue: true,
    retryStrategy(times) {
      return Math.min(times * 1000, 5000); // 1s..5s
    },
  };

  if (url && (url.startsWith('redis://') || url.startsWith('rediss://'))) {
    // ioredis tự bật TLS khi là rediss://
    client = new IORedis(url, baseOpts);
    console.log('🔧 ioredis via URL:', url.startsWith('rediss://') ? 'TLS' : 'non-TLS');
  } else {
    const tlsEnabled = String(process.env.REDIS_TLS).toLowerCase() === 'true';
    client = new IORedis({
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT!),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB ?? 0),
      ...(tlsEnabled ? { tls: {} } : {}),   // chỉ thêm TLS khi cần
      ...baseOpts,
    });
    console.log('🔧 ioredis via host/port:', {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      db: process.env.REDIS_DB ?? 0,
      tls: tlsEnabled,
    });
  }

  client.on('connect', () => console.log('✅ Redis connected'));
  client.on('ready',   () => console.log('✅ Redis ready'));
  client.on('error',   (e) => console.error('❌ Redis error:', e.message));
  client.on('close',   () => console.log('🔌 Redis connection closed'));
  client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

  return client;
}

export async function initRedis(): Promise<IORedis> {
  const c = getRedisClient();
  const pong = await c.ping();
  console.log('✅ Redis ping:', pong);
  return c;
}

export async function closeRedisClient(): Promise<void> {
  if (client) await client.quit();
}