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
      // Use individual config (Bull-compatible)
      redisConfig = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        // Bull-compatible options
        connectTimeout: 10000,
        lazyConnect: true,
        enableOfflineQueue: true, // Allow offline queue for better reliability
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
    
    client.on('ready', () => {
      console.log('✅ Redis ready');
    });
    
    client.on('error', (error) => {
      console.error('❌ Redis error:', error.message);
    });
    
    client.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
    
    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }
  return client;
}

export async function initRedis(): Promise<IORedis> {
  const c = getRedisClient();
  
  try {
    console.log('🔄 Testing Redis connection...');
    
    // Log environment info for debugging
    console.log('🌐 Environment info:', {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version
    });
    
    console.log('🔧 Redis connection details:', {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
      hasPassword: !!config.redis.password,
      redisUrl: process.env.REDIS_URL ? 'REDIS_URL provided' : 'Using individual config'
    });
    
    const pong = await c.ping();
    console.log('✅ Redis ping successful:', pong);
    
    // Test basic Redis operations
    await c.set('test:connection', 'ok', 'EX', 10);
    const testValue = await c.get('test:connection');
    console.log('✅ Redis read/write test successful:', testValue);
    
    return c;
  } catch (error: any) {
    console.error('❌ Redis connection failed:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
    
    // Check if it's an IP whitelist issue
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('🚨 Possible IP whitelist issue! Check Redis Cloud settings:');
      console.error('   1. Go to Redis Cloud dashboard');
      console.error('   2. Check Access Control → IP Whitelist');
      console.error('   3. Add Render IP ranges or 0.0.0.0/0 (temporarily)');
    }
    
    throw new Error(`Redis connection failed: ${error.message}`);
  }
}


export function closeRedisClient(): Promise<void> {
  if (client) {
    return client.quit().then(() => {});
  }
  return Promise.resolve();
}
