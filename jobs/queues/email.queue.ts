import Bull from 'bull';
import dotenv from 'dotenv';
import logger from '../../utils/logger';

dotenv.config();

const emailQueue = new Bull('emailQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2 seconds delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    delay: 0 // No initial delay
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

logger.info('Email queue initialized');

export default emailQueue;
