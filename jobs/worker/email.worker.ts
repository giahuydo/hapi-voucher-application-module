import dotenv from 'dotenv';
import mongoose from 'mongoose';
import emailQueue from '../queues/email.queue';
import { sendEmail } from '../services/email.service';
import {logger} from '../../utils/logger';

dotenv.config();

// Explicitly register the process handler for 'send-voucher-email' job type
const registerProcessHandlers = () => {
  logger.info('🔧 Registering process handlers for email queue...');
  
  // Register specific handler for 'send-voucher-email' job type
  emailQueue.process('send-voucher-email', async (job) => {
    const voucherData = job.data;
    const { to, code, name, eventName } = voucherData;
    
    try {
      logger.info(`🔄 Processing send-voucher-email job ${job.id} for ${to} (${name}) - Event: ${eventName} (attempt ${job.attemptsMade + 1})`);
      console.log(`🔄 Processing send-voucher-email job ${job.id} for ${to} (${name}) - Event: ${eventName} (attempt ${job.attemptsMade + 1})`);
      
      // Log job data for debugging
      logger.info(`📋 Job data:`, {
        jobId: job.id,
        email: to,
        code,
        name,
        eventName,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts || 3,
        jobData: voucherData
      });
      console.log(`📋 Job data:`, {
        jobId: job.id,
        email: to,
        code,
        name,
        eventName,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts || 3
      });
      
      const result = await sendEmail(voucherData);
      
      if (result.success) {
        logger.info(`✅ Send-voucher-email job ${job.id} completed successfully. Message ID: ${result.messageId}`);
        console.log(`✅ Send-voucher-email job ${job.id} completed successfully. Message ID: ${result.messageId}`);
        return result;
      } else {
        logger.error(`❌ Send-voucher-email job ${job.id} failed: ${result.error}`);
        console.error(`❌ Send-voucher-email job ${job.id} failed: ${result.error}`);
        throw new Error(result.error || 'Email sending failed');
      }
      
    } catch (error: any) {
      logger.error(`❌ Send-voucher-email job ${job.id} failed for ${to}:`, {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        jobId: job.id,
        email: to,
        code,
        attempts: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts || 3,
        errorCode: error?.code,
        command: error?.command,
        response: error?.response
      });
      console.error(`❌ Send-voucher-email job ${job.id} failed for ${to}:`, {
        error: error?.message || 'Unknown error',
        jobId: job.id,
        email: to,
        code,
        attempts: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts || 3,
        errorCode: error?.code,
        command: error?.command,
        response: error?.response
      });
      
      // Re-throw to trigger retry mechanism
      throw error;
    }
  });
  
  logger.info('✅ Process handlers registered successfully');
};

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
    // Check if MongoDB is already connected (when running in same process as server)
    if (mongoose.connection.readyState === 1) {
      logger.info('✅ Email worker using existing MongoDB connection');
    } else {
      // Connect to MongoDB (when running standalone)
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voucher_app';
      await mongoose.connect(mongoUri);
      logger.info('✅ Email worker connected to MongoDB');
    }

    // Register process handlers
    registerProcessHandlers();

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

// Export the worker functions instead of the queue
export { init as startEmailWorker };
export default { startEmailWorker: init };
