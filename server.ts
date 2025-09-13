// Load environment variables first, before anything else uses process.env
import * as dotenv from 'dotenv';
dotenv.config();

import Hapi from '@hapi/hapi';
import mongoose from 'mongoose';
import { initRedis, closeRedisClient } from './src/config/redis';

// Plugins
import AuthJwtPlugin from './src/plugins/auth-jwt.plugin';
import ErrorHandlerPlugin from './src/plugins/error-handler.plugin';
import SwaggerPlugin from './src/plugins/swagger.plugin';
import AgendaPlugin from './src/plugins/agenda.plugin';
import BullBoardPlugin from './src/plugins/bull-board.plugin';

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

    // 3) Create Hapi server
    const server = Hapi.server({
      port: Number(process.env.PORT) || 3000,
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
    console.log('✅ Hapi server initialized');

    // 4) Health check route (no auth required)
    server.route({
      method: 'GET',
      path: '/',
      options: { auth: false, description: 'Health check', tags: ['api'] },
      handler: () => ({ message: '🎉 Hapi server is running!' }),
    });

    // 5) Register plugins (auth, error handling, docs, schedulers, dashboards)
    await server.register([
      AuthJwtPlugin,
      ErrorHandlerPlugin,
      SwaggerPlugin,
      AgendaPlugin,
      BullBoardPlugin,
    ]);
    console.log('✅ Plugins registered');

    // 6) Register routes (auth, voucher, event, user)
    const publicAuthRoutes = preparePublicRoutes(authRoutes);
    server.route([...publicAuthRoutes, ...voucherRoutes, ...eventRoutes, ...userRoutes]);
    console.log('✅ Routes registered');

    // 7) Start server
    await server.start();
    console.log(`🚀 Server running at ${server.info.uri}`);
    console.log(`📚 Swagger docs at ${server.info.uri}/docs`);

    // 8) Graceful shutdown on SIGTERM or SIGINT
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