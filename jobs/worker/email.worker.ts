import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Bull from 'bull';
import emailQueue from '../queues/email.queue';
import { sendEmail } from '../services/email.service';
import logger from '../../utils/logger';

dotenv.config();

interface EmailJobData {
  to: string;
  code: string;
}

// Configure job processing with retry options
emailQueue.process(async (job) => {
  const { to, code } = job.data as EmailJobData;
  
  try {
    logger.info(`Processing email job ${job.id} for ${to} (attempt ${job.attemptsMade + 1})`);
    
    const result = await sendEmail({ to, code });
    
    if (result.success) {
      logger.info(`Email job ${job.id} completed successfully. Message ID: ${result.messageId}`);
      return result;
    } else {
      logger.error(`Email job ${job.id} failed: ${result.error}`);
      throw new Error(result.error || 'Email sending failed');
    }
    
  } catch (error: any) {
    logger.error(`Email job ${job.id} failed for ${to}:`, {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      jobId: job.id,
      email: to,
      code,
      attempts: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts || 3
    });
    
    // Re-throw to trigger retry mechanism
    throw error;
  }
});

// Handle job completion
emailQueue.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});

// Handle job failure
emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed:`, {
    error: err?.message || 'Unknown error',
    stack: err?.stack,
    jobId: job?.id,
    attempts: job?.attemptsMade || 0
  });
});

// Handle queue errors
emailQueue.on('error', (error) => {
  logger.error('Email queue error:', {
    error: error?.message || 'Unknown error',
    stack: error?.stack
  });
});

// Handle queue waiting
emailQueue.on('waiting', (jobId) => {
  logger.debug(`Email job ${jobId} is waiting to be processed`);
});

// Handle queue active
emailQueue.on('active', (job) => {
  logger.debug(`Email job ${job.id} has started processing`);
});

// Monitor queue health
setInterval(async () => {
  try {
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    const completed = await emailQueue.getCompleted();
    const failed = await emailQueue.getFailed();
    
    logger.info('Email queue status:', {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    });
  } catch (error: any) {
    logger.error('Failed to get queue status:', error?.message);
  }
}, 30000); // Check every 30 seconds

// Initialize worker
const init = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voucher_app';
    await mongoose.connect(mongoUri);
    logger.info('✅ Email worker connected to MongoDB');

    logger.info('🚀 Email worker started successfully');
    logger.info('📧 Ready to process email jobs from queue');

    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down email worker...');
      await mongoose.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down email worker...');
      await mongoose.disconnect();
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('❌ Failed to start email worker:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack
    });
    process.exit(1);
  }
};

// Start the worker if this file is run directly
if (require.main === module) {
  init();
}

export default emailQueue;
