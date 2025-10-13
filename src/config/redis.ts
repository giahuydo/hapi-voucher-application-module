import IORedis from 'ioredis';
import config from './index';

let client: IORedis | null = null;

export function getRedisClient(): IORedis {
  if (!client) {
    // Check if REDIS_URL is provided (Redis Cloud format)
    const redisUrl = process.env.REDIS_URL;
    
    let redisConfig;
    
    if (redisUrl && redisUrl.includes('://')) {
      // Use Redis URL (Redis Cloud format)
      console.log('🔧 Using Redis URL connection');
      redisConfig = redisUrl;
    } else {
      // Use individual config
      redisConfig = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        connectTimeout: 10000,
        lazyConnect: true,
        enableOfflineQueue: false,
      };
      
      console.log('🔧 Redis config:', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        hasPassword: !!redisConfig.password
      });
    }
    
    if (typeof redisConfig === 'string') {
      client = new IORedis(redisConfig);
    } else {
      client = new IORedis(redisConfig);
    }
    
    // Add event listeners for debugging
    client.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    client.on('error', (error) => {
      console.error('❌ Redis error:', error.message);
    });
    
    client.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
  }
  return client;
}

export async function initRedis(): Promise<IORedis> {
  const c = getRedisClient();
  
  try {
    console.log('🔄 Testing Redis connection...');
    const pong = await c.ping();
    console.log('✅ Redis ping successful:', pong);
    return c;
  } catch (error: any) {
    console.error('❌ Redis connection failed:', error.message);
    throw new Error(`Redis connection failed: ${error.message}`);
  }
}


export function closeRedisClient(): Promise<void> {
  if (client) {
    return client.quit().then(() => {});
  }
  return Promise.resolve();
}
