// Load environment variables first, before anything else uses process.env
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import Hapi from '@hapi/hapi';
import mongoose from 'mongoose';
import { initRedis, closeRedisClient } from './src/config/redis';
// Import worker - different paths for dev vs production
const prodPath = path.resolve(__dirname, 'jobs/worker/email.worker.js');          // khi đã build ra dist
const devPath  = path.resolve(__dirname, '../src/jobs/worker/email.worker.ts');  // khi chạy ts-node/ts-node-dev

const candidate = fs.existsSync(prodPath) ? prodPath : devPath;
const { startEmailWorker } = require(candidate);

// Plugins
import AuthJwtPlugin from './src/plugins/auth-jwt.plugin';
import ErrorHandlerPlugin from './src/plugins/error-handler.plugin';
import SwaggerPlugin from './src/plugins/swagger.plugin';
import AgendaPlugin from './src/plugins/agenda.plugin';
import BullBoardPlugin from './src/plugins/bull-board.plugin';
import TelescopePlugin from './src/plugins/telescope.plugin';
import PinoLoggerPlugin from './src/plugins/pino-logger.plugin';

// Routes
import voucherRoutes from './src/modules/voucher/api/voucher.routes';
import eventRoutes from './src/modules/event/api/event.routes';
import authRoutes from './src/modules/auth/api/auth.routes';
import { userRoutes } from './src/modules/user/api/user.routes';

// Helper: mark a route as public (auth: false)
const preparePublicRoutes = (routes: Hapi.ServerRoute[]): Hapi.ServerRoute[] => {
  return routes.map((route) => ({
    ...route,
    options: { ...(route.options ?? {}), auth: false },
  }));
};

async function init() {
  try {
    // 1) Connect to MongoDB first
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voucher_app';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB');

    // 2) Initialize Redis after Mongo
    await initRedis(); // make sure initRedis() calls ping internally
    console.log('✅ Redis ready');

    // 3) Start Email Worker (in same process)
    try {
      console.log('🔄 Starting email worker...');
      await startEmailWorker();
      console.log('✅ Email worker started successfully');
      console.log('📧 Email worker is ready to process jobs');
    } catch (error) {
      console.error('❌ Failed to start email worker:', error);
      console.error('Error details:', error);
      // Don't exit, continue with web server
    }

    // 4) Create Hapi server with port fallback
    const createServerWithFallback = async (port: number, maxAttempts = 5): Promise<Hapi.Server> => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const server = Hapi.server({
            port: port + attempt,
            host: '0.0.0.0',
            routes: {
              cors: {
                origin: ['*'],
                additionalHeaders: ['authorization', 'content-type'],
                additionalExposedHeaders: ['authorization'],
                credentials: true,
              },
            },
            debug: { request: ['error', 'uncaught'] },
          });
          
          if (attempt > 0) {
            console.log(`⚠️  Port ${port} was busy, using port ${port + attempt} instead`);
          }
          
          return server;
        } catch (err: any) {
          if (err.code === 'EADDRINUSE' && attempt < maxAttempts - 1) {
            console.log(`⚠️  Port ${port + attempt} is busy, trying ${port + attempt + 1}...`);
            continue;
          }
          throw err;
        }
      }
      throw new Error(`All ports ${port}-${port + maxAttempts - 1} are busy`);
    };

    const server = await createServerWithFallback(Number(process.env.PORT) || 3000);
    console.log('✅ Hapi server initialized');

    // 4) Health check route (no auth required)
    server.route({
      method: 'GET',
      path: '/',
      options: { auth: false, description: 'Health check', tags: ['api'] },
      handler: () => ({ message: '🎉 Hapi server is running!' }),
    });

    // 5) Register plugins (auth, error handling, docs, schedulers, dashboards)
    const plugins = [
      // PinoLoggerPlugin,
      AuthJwtPlugin,
      ErrorHandlerPlugin,
      SwaggerPlugin,
      AgendaPlugin,
      BullBoardPlugin,
    ];
    
    // Only register TelescopePlugin in development
    if (process.env.NODE_ENV !== 'production') {
      plugins.push(TelescopePlugin);
    }
    
    await server.register(plugins);
    console.log('✅ Plugins registered');

    // 6) Register routes (auth, voucher, event, user)
    const publicAuthRoutes = preparePublicRoutes(authRoutes);
    server.route([...publicAuthRoutes, ...voucherRoutes, ...eventRoutes, ...userRoutes]);
    console.log('✅ Routes registered');

    // 7) Filter out Render health check logs
    server.events.on('response', (request) => {
      const userAgent = request.headers['user-agent'] || '';
      if (userAgent.startsWith('Render/')) return; // Skip Render health check logs
    });

    // 8) Start server
    await server.start();
    console.log(`🚀 Server running at ${server.info.uri}`);
    console.log(`📚 Swagger docs at ${server.info.uri}/docs`);
    
    // Only show Telescope Dashboard in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔭 Telescope Dashboard at ${server.info.uri}/telescope`);
    }

    // 9) Graceful shutdown on SIGTERM or SIGINT
    const shutdown = async (signal: string) => {
      console.log(`🛑 ${signal} received. Cleaning up...`);
      try {
        await server.stop({ timeout: 10000 });
        await mongoose.disconnect();
        await closeRedisClient();
        console.log('👋 Server stopped cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

init();