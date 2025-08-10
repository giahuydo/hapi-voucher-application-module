import Bull from 'bull';
import { Job } from 'bull';
import * as dotenv from 'dotenv';
import { logger } from '../../utils/logger';

dotenv.config();

export interface VoucherJobData {
  eventId: string;
  userId: string;
  voucherCode: string;
  email: string;
  action?: 'issue_and_notify' | 'process_only' | 'email_only'; // New field for job type
}

const voucherQueue = new Bull('voucherQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2 seconds delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    delay: 0, // No initial delay
    priority: 1 // Higher priority than email jobs
  }
});

// Queue event handlers
voucherQueue.on('error', (error) => {
  logger.error('Voucher queue error:', {
    error: error?.message || 'Unknown error',
    stack: error?.stack
  });
});

voucherQueue.on('waiting', (job: Job) => {
  logger.info(`Voucher job ${job.id} waiting to be processed`);
});

voucherQueue.on('active', (job: Job) => {
  logger.info(`Voucher job ${job.id} started processing`);
});

voucherQueue.on('completed', (job: Job, result) => {
  logger.info(`Voucher job ${job.id} completed successfully`, {
    result,
    processingTime: Date.now() - job.timestamp
  });
});

voucherQueue.on('failed', (job: Job, err) => {
  logger.error(`Voucher job ${job.id} failed:`, {
    error: err?.message || 'Unknown error',
    stack: err?.stack,
    attempts: job.attemptsMade,
    data: job.data
  });
});

voucherQueue.on('stalled', (job: Job) => {
  logger.warn(`Voucher job ${job.id} stalled`);
});

// Queue monitoring
voucherQueue.on('global:completed', (jobId, result) => {
  logger.info(`Global: Voucher job ${jobId} completed with result:`, result);
});

voucherQueue.on('global:failed', (jobId, err) => {
  logger.error(`Global: Voucher job ${jobId} failed:`, err);
});

// Add voucher processing job
export const addVoucherJob = async (data: VoucherJobData, options?: Bull.JobOptions) => {
  try {
    const job = await voucherQueue.add('process-voucher', data, {
      ...options,
      jobId: `voucher_${data.eventId}_${data.userId}_${Date.now()}`
    });

    logger.info(`Voucher job added to queue: ${job.id}`, {
      eventId: data.eventId,
      userId: data.userId,
      voucherCode: data.voucherCode
    });

    return job;
  } catch (error: any) {
    logger.error('Failed to add voucher job to queue:', {
      error: error?.message || 'Unknown error',
      data
    });
    throw error;
  }
};

// Get queue statistics
export const getVoucherQueueStats = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      voucherQueue.getWaiting(),
      voucherQueue.getActive(),
      voucherQueue.getCompleted(),
      voucherQueue.getFailed(),
      voucherQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  } catch (error: any) {
    logger.error('Failed to get voucher queue stats:', error?.message);
    throw error;
  }
};

// Clean old jobs
export const cleanVoucherQueue = async (olderThanHours: number = 24) => {
  try {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    const [completed, failed] = await Promise.all([
      voucherQueue.getCompleted(),
      voucherQueue.getFailed()
    ]);

    let cleanedCount = 0;

    // Clean old completed jobs
    for (const job of completed) {
      if (job.finishedOn && job.finishedOn < cutoffTime) {
        await job.remove();
        cleanedCount++;
      }
    }

    // Clean old failed jobs
    for (const job of failed) {
      if (job.finishedOn && job.finishedOn < cutoffTime) {
        await job.remove();
        cleanedCount++;
      }
    }

    logger.info(`Cleaned ${cleanedCount} old voucher jobs (older than ${olderThanHours} hours)`);
    return cleanedCount;
  } catch (error: any) {
    logger.error('Failed to clean voucher queue:', error?.message);
    throw error;
  }
};

export default voucherQueue;
