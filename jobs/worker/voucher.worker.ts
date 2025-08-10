import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import Bull from 'bull';
import voucherQueue from '../queues/voucher.queue';
import { logger } from '../../utils/logger';
import { sendEmail } from '../services/email.service';

dotenv.config();

interface VoucherJobData {
  eventId: string;
  userId: string;
  voucherCode: string;
  email: string;
  action?: string; // Added action field
}

// Configure job processing with retry options
voucherQueue.process('process-voucher', async (job: any) => {
  const { eventId, userId, voucherCode, email, action = 'issue_and_notify' } = job.data as VoucherJobData;
  
  try {
    logger.info(`Processing voucher job ${job.id} for event ${eventId}, user ${userId} (attempt ${job.attemptsMade + 1})`);
    logger.info(`Job action: ${action}`);
    
    let result: any = {};
    
    switch (action) {
      case 'issue_and_notify':
        // Complete voucher processing + email notification
        result = await processCompleteVoucherJob(eventId, userId, voucherCode, email);
        break;
        
      case 'process_only':
        // Only process voucher (no email)
        result = await processVoucherOnly(eventId, userId, voucherCode);
        break;
        
      case 'email_only':
        // Only send email notification
        result = await sendEmailOnly(userId, voucherCode, email);
        break;
        
      default:
        // Default to complete processing
        result = await processCompleteVoucherJob(eventId, userId, voucherCode, email);
    }
    
    logger.info(`Voucher job ${job.id} completed successfully`, result);
    return result;
    
  } catch (error: any) {
    logger.error(`Voucher job ${job.id} failed for event ${eventId}, user ${userId}:`, {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      jobId: job.id,
      eventId,
      userId,
      voucherCode,
      action,
      attempts: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts || 3
    });
    throw error;
  }
});

// Handle test jobs
voucherQueue.process('test', async (job: any) => {
  const { eventId, userId, voucherCode, email, action = 'issue_and_notify' } = job.data as VoucherJobData;
  
  try {
    logger.info(`Processing TEST voucher job ${job.id} for event ${eventId}, user ${userId} (attempt ${job.attemptsMade + 1})`);
    logger.info(`Test job action: ${action}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = {
      success: true,
      eventId,
      userId,
      voucherCode,
      processedAt: new Date().toISOString(),
      processingTime: 500,
      emailSent: action === 'issue_and_notify' || action === 'email_only',
      action,
      isTestJob: true
    };
    
    logger.info(`TEST voucher job ${job.id} completed successfully`, result);
    return result;
    
  } catch (error: any) {
    logger.error(`TEST voucher job ${job.id} failed:`, {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      jobId: job.id,
      eventId,
      userId,
      voucherCode,
      action,
      attempts: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts || 3
    });
    throw error;
  }
});

// Handle default jobs (fallback)
voucherQueue.process(async (job: any) => {
  const { eventId, userId, voucherCode, email, action = 'issue_and_notify' } = job.data as VoucherJobData;
  
  try {
    logger.info(`Processing DEFAULT voucher job ${job.id} for event ${eventId}, user ${userId} (attempt ${job.attemptsMade + 1})`);
    logger.info(`Default job action: ${action}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      success: true,
      eventId,
      userId,
      voucherCode,
      processedAt: new Date().toISOString(),
      processingTime: 1000,
      emailSent: action === 'issue_and_notify' || action === 'email_only',
      action,
      isDefaultJob: true
    };
    
    logger.info(`DEFAULT voucher job ${job.id} completed successfully`, result);
    return result;
    
  } catch (error: any) {
    logger.error(`DEFAULT voucher job ${job.id} failed:`, {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      jobId: job.id,
      eventId,
      userId,
      voucherCode,
      action,
      attempts: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts || 3
    });
    throw error;
  }
});

// Helper functions for different job types
async function processCompleteVoucherJob(eventId: string, userId: string, voucherCode: string, email: string) {
  logger.info(`Processing complete voucher job for user ${userId} with code ${voucherCode}`);
  
  // Process voucher (update database, etc.)
  // For now, we'll simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Actually send email
  logger.info(`Sending email to ${email} with voucher code ${voucherCode}`);
  const emailResult = await sendEmail({ to: email, code: voucherCode });
  
  if (!emailResult.success) {
    throw new Error(`Failed to send email: ${emailResult.error}`);
  }
  
  logger.info(`Email sent successfully to ${email}. Message ID: ${emailResult.messageId}`);
  
  return {
    success: true,
    eventId,
    userId,
    voucherCode,
    processedAt: new Date().toISOString(),
    processingTime: Date.now() - Date.now(),
    emailSent: true,
    emailMessageId: emailResult.messageId,
    action: 'issue_and_notify'
  };
}

async function processVoucherOnly(eventId: string, userId: string, voucherCode: string) {
  // Simulate voucher processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    eventId,
    userId,
    voucherCode,
    processedAt: new Date().toISOString(),
    processingTime: Date.now() - Date.now(),
    emailSent: false,
    action: 'process_only'
  };
}

async function sendEmailOnly(userId: string, voucherCode: string, email: string) {
  logger.info(`Sending email only to ${email} with voucher code ${voucherCode}`);
  
  // Actually send email
  const emailResult = await sendEmail({ to: email, code: voucherCode });
  
  if (!emailResult.success) {
    throw new Error(`Failed to send email: ${emailResult.error}`);
  }
  
  logger.info(`Email sent successfully to ${email}. Message ID: ${emailResult.messageId}`);
  
  return {
    success: true,
    userId,
    voucherCode,
    email,
    processedAt: new Date().toISOString(),
    processingTime: Date.now() - Date.now(),
    emailSent: true,
    emailMessageId: emailResult.messageId,
    action: 'email_only'
  };
}

// Handle queue errors
voucherQueue.on('error', (error: any) => {
  logger.error('Voucher queue error:', {
    error: error?.message || 'Unknown error',
    stack: error?.stack
  });
});

// Handle failed jobs
voucherQueue.on('failed', (job: any, err: any) => {
  logger.error(`Voucher job ${job.id} failed permanently after ${job.attemptsMade} attempts:`, {
    error: err?.message || 'Unknown error',
    data: job.data
  });
});

// Handle stalled jobs
voucherQueue.on('stalled', (job: any) => {
  logger.warn(`Voucher job ${job.id} stalled and will be retried`);
});

// Monitor queue health
setInterval(async () => {
  try {
    const stats = await voucherQueue.getJobCounts();
    
    logger.info('Voucher queue status:', {
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      delayed: stats.delayed
    });
  } catch (error: any) {
    logger.error('Failed to get voucher queue status:', error?.message);
  }
}, 30000); // Check every 30 seconds

// Clean old jobs periodically
setInterval(async () => {
  try {
    const cleanedJobs = await voucherQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean jobs older than 24 hours
    if (cleanedJobs.length > 0) {
      logger.info(`Cleaned ${cleanedJobs.length} old completed voucher jobs`);
    }
  } catch (error: any) {
    logger.error('Failed to clean old voucher jobs:', error?.message);
  }
}, 60 * 60 * 1000); // Clean every hour

// Initialize worker
const init = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voucher_app';
    await mongoose.connect(mongoUri);
    logger.info('✅ Voucher worker connected to MongoDB');

    logger.info('🚀 Voucher worker started successfully');
    logger.info('🎫 Ready to process voucher jobs from queue');

    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down voucher worker...');
      await mongoose.disconnect();
      await voucherQueue.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down voucher worker...');
      await mongoose.disconnect();
      await voucherQueue.close();
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('❌ Failed to start voucher worker:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack
    });
    process.exit(1);
  }
};

// Start the worker
init().catch((error) => {
  logger.error('❌ Failed to initialize voucher worker:', error);
  process.exit(1);
});
