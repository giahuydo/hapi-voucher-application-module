import { Plugin } from '@hapi/hapi';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { HapiAdapter } from '@bull-board/hapi';
import Joi from 'joi';
import emailQueue from '../../jobs/queues/email.queue';
import voucherQueue from '../../jobs/queues/voucher.queue';

const BullBoardPlugin: Plugin<undefined> = {
  name: 'BullBoardPlugin',
  version: '1.0.0',
  register: async (server) => {
    console.log('🔄 Initializing Bull Board...');

    // Create Bull Board with UI
    const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
      queues: [
        new BullAdapter(emailQueue),
        new BullAdapter(voucherQueue)
      ],
      serverAdapter: new HapiAdapter()
    });

    // Register required plugins for static file serving
    await server.register(require('@hapi/inert'));
    await server.register(require('@hapi/vision'));

    // Configure view engine
    server.views({
      engines: {
        html: require('handlebars')
      },
      relativeTo: __dirname,
      path: '../templates'
    });

    // Serve Bull Board UI Dashboard
    server.route({
      method: 'GET',
      path: '/admin/queues',
      options: {
        auth: false,
        description: 'Bull Board Dashboard',
        tags: ['admin'],
        handler: {
          view: {
            template: 'bull-board',
            context: {
              title: 'Queue Dashboard'
            }
          }
        }
      }
    });

    // API Routes for Queue Management
    // Get all queues status
    server.route({
      method: 'GET',
      path: '/admin/queues/api/status',
      options: {
        auth: false,
        description: 'Get status of all queues',
        tags: ['admin'],
        handler: async (request, h) => {
          try {
            const emailStats = await emailQueue.getJobCounts();
            const voucherStats = await voucherQueue.getJobCounts();
            
            return h.response({
              success: true,
              data: {
                email: {
                  name: 'email',
                  counts: emailStats,
                  isPaused: emailQueue.isPaused()
                },
                voucher: {
                  name: 'voucher', 
                  counts: voucherStats,
                  isPaused: voucherQueue.isPaused()
                }
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    // Get specific queue status
    server.route({
      method: 'GET',
      path: '/admin/queues/api/{queueName}/status',
      options: {
        auth: false,
        description: 'Get status of specific queue',
        tags: ['admin'],
        validate: {
          params: Joi.object({
            queueName: Joi.string().valid('email', 'voucher').required()
          })
        },
        handler: async (request, h) => {
          try {
            const { queueName } = request.params as any;
            const queue = queueName === 'email' ? emailQueue : voucherQueue;
            const counts = await queue.getJobCounts();
            
            return h.response({
              success: true,
              data: {
                name: queueName,
                counts,
                isPaused: queue.isPaused()
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    // Clean failed jobs for specific queue
    server.route({
      method: 'POST',
      path: '/admin/queues/api/{queueName}/clean-failed',
      options: {
        auth: false,
        description: 'Clean failed jobs for specific queue',
        tags: ['admin'],
        validate: {
          params: Joi.object({
            queueName: Joi.string().valid('email', 'voucher').required()
          })
        },
        handler: async (request, h) => {
          try {
            const { queueName } = request.params as any;
            const queue = queueName === 'email' ? emailQueue : voucherQueue;
            
            const cleanedCount = await queue.clean(24 * 60 * 60 * 1000, 'failed');
            
            return h.response({
              success: true,
              data: {
                message: `Cleaned ${cleanedCount.length} failed jobs from ${queueName} queue`,
                cleanedCount: cleanedCount.length
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    // Retry failed jobs for specific queue
    server.route({
      method: 'POST',
      path: '/admin/queues/api/{queueName}/retry-failed',
      options: {
        auth: false,
        description: 'Retry failed jobs for specific queue',
        tags: ['admin'],
        validate: {
          params: Joi.object({
            queueName: Joi.string().valid('email', 'voucher').required()
          })
        },
        handler: async (request, h) => {
          try {
            const { queueName } = request.params as any;
            const queue = queueName === 'email' ? emailQueue : voucherQueue;
            
            const failedJobs = await queue.getFailed();
            let retriedCount = 0;
            
            for (const job of failedJobs) {
              await job.retry();
              retriedCount++;
            }
            
            return h.response({
              success: true,
              data: {
                message: `Retried ${retriedCount} failed jobs from ${queueName} queue`,
                retriedCount
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    // Pause/Resume specific queue
    server.route({
      method: 'POST',
      path: '/admin/queues/api/{queueName}/{action}',
      options: {
        auth: false,
        description: 'Pause or resume specific queue',
        tags: ['admin'],
        validate: {
          params: Joi.object({
            queueName: Joi.string().valid('email', 'voucher').required(),
            action: Joi.string().valid('pause', 'resume').required()
          })
        },
        handler: async (request, h) => {
          try {
            const { queueName, action } = request.params as any;
            const queue = queueName === 'email' ? emailQueue : voucherQueue;
            
            if (action === 'pause') {
              await queue.pause();
            } else {
              await queue.resume();
            }
            
            return h.response({
              success: true,
              data: {
                message: `${queueName} queue ${action}d successfully`,
                isPaused: queue.isPaused()
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    // Test job creation for voucher queue
    server.route({
      method: 'POST',
      path: '/admin/queues/api/voucher/test-job',
      options: {
        auth: false,
        description: 'Create a test job in voucher queue',
        tags: ['admin'],
        handler: async (request, h) => {
          try {
            const testJob = await voucherQueue.add('test', {
              eventId: 'test-event-123',
              userId: 'test-user-456',
              voucherCode: 'TEST123',
              email: 'test@example.com',
              action: 'issue_and_notify'
            });
            
            return h.response({
              success: true,
              data: {
                message: 'Test job created successfully',
                jobId: testJob.id,
                queue: 'voucher'
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    // Get failed jobs for debugging
    server.route({
      method: 'GET',
      path: '/admin/queues/api/{queueName}/failed-jobs',
      options: {
        auth: false,
        description: 'Get failed jobs details for debugging',
        tags: ['admin'],
        validate: {
          params: Joi.object({
            queueName: Joi.string().valid('email', 'voucher').required()
          })
        },
        handler: async (request, h) => {
          try {
            const { queueName } = request.params as any;
            const queue = queueName === 'email' ? emailQueue : voucherQueue;
            
            const failedJobs = await queue.getFailed();
            const failedJobsDetails = await Promise.all(
              failedJobs.map(async (job) => ({
                id: job.id,
                data: job.data,
                failedReason: job.failedReason,
                attemptsMade: job.attemptsMade,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn
              }))
            );
            
            return h.response({
              success: true,
              data: {
                queueName,
                failedCount: failedJobs.length,
                failedJobs: failedJobsDetails
              }
            }).code(200);
          } catch (error: any) {
            return h.response({
              success: false,
              error: 'InternalServerError',
              message: error.message
            }).code(500);
          }
        }
      }
    });

    console.log('✅ Bull Board plugin registered');
    console.log('📊 Queue dashboard available at /admin/queues');
    console.log('🔧 Queue API available at /admin/queues/api/*');
    console.log('📧 Email queue and 🎫 Voucher queue registered');
  }
};

export default BullBoardPlugin;
