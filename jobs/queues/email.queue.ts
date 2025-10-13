// src/queues/email.queue.ts
import Bull from 'bull';
import { logger } from '../../utils/logger';

function buildBullRedisOpts() {
  const url = process.env.REDIS_URL?.trim();

  // Bull v4 có thể nhận connection string "redis://user:pass@host:port"
  // nhưng với TLS thì nhiều khi bạn nên parse để chủ động thêm tls:{}
  if (url && (url.startsWith('redis://') || url.startsWith('rediss://'))) {
    const u = new URL(url);
    const isTLS = u.protocol === 'rediss:';
    return {
      host: u.hostname,
      port: Number(u.port),
      password: u.password || undefined,
      db: Number(u.searchParams.get('db') || 0),
      ...(isTLS ? { tls: {} } : {}),
    };
  }

  const tlsEnabled = String(process.env.REDIS_TLS).toLowerCase() === 'true';
  return {
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT!),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),
    ...(tlsEnabled ? { tls: {} } : {}),
  };
}

const bullRedis = buildBullRedisOpts();

console.log('🔧 Bull Redis config:', {
  host: bullRedis.host,
  port: bullRedis.port,
  db: bullRedis.db,
  hasPassword: !!bullRedis.password,
  hasTLS: !!(bullRedis as any).tls,
});

const emailQueue = new Bull('emailQueue', {
  redis: bullRedis,
  defaultJobOptions: {
    attempts: Number(process.env.BULL_ATTEMPTS ?? 3),
    backoff: {
      type: (process.env.BULL_BACKOFF_TYPE as 'fixed' | 'exponential') ?? 'exponential',
      delay: Number(process.env.BULL_BACKOFF_DELAY ?? 2000),
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

emailQueue.on('error', (error) => {
  logger.error('Email queue error:', { error: error?.message, stack: error?.stack });
});

export default emailQueue;