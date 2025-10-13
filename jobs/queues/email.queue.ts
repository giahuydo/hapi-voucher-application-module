import Bull from 'bull';
import {logger} from '../../utils/logger';
import { getRedisClient } from '../../src/config/redis';
import config from '../../src/config';

// Create Bull-compatible Redis config
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  // Bull-compatible options only
  connectTimeout: 10000,
  lazyConnect: true,
  enableOfflineQueue: true, // Allow offline queue for better reliability
};

const emailQueue = new Bull('emailQueue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: config.queue.bull.defaultJobOptions.attempts,
    backoff: {
      type: config.queue.bull.defaultJobOptions.backoff.type,
      delay: config.queue.bull.defaultJobOptions.backoff.delay
    },
    removeOnComplete: config.queue.bull.defaultJobOptions.removeOnComplete,
    removeOnFail: config.queue.bull.defaultJobOptions.removeOnFail
  }
});

// Queue event handlers
emailQueue.on('error', (error) => {
  logger.error('Email queue error:', {
    error: error?.message || 'Unknown error',
    stack: error?.stack
  });
});

emailQueue.on('waiting', (jobId) => {
  logger.debug(`Email job ${jobId} added to queue`);
});

emailQueue.on('stalled', (jobId) => {
  logger.warn(`Email job ${jobId} stalled`);
});

emailQueue.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed:`, {
    error: err?.message || 'Unknown error',
    stack: err?.stack,
    jobId: job?.id
  });
});

export default emailQueue;
