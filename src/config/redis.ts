import IORedis from 'ioredis';
import config from './index';

let client: IORedis | null = null;

export function getRedisClient(): IORedis {
  if (!client) {
    client = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return client;
}

export function closeRedisClient(): Promise<void> {
  if (client) {
    return client.quit().then(() => {});
  }
  return Promise.resolve();
}
