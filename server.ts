import Hapi from '@hapi/hapi';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load .env config
dotenv.config();

// Plugin imports
import AuthJwtPlugin from './src/plugins/auth-jwt.plugin';
import ErrorHandlerPlugin from './src/plugins/error-handler.plugin';
import SwaggerPlugin from './src/plugins/swagger.plugin';
import AgendaPlugin from './src/plugins/agenda.plugin';

// Routes
import voucherRoutes from './src/modules/voucher/api/voucher.routes';
import eventRoutes from './src/modules/event/api/event.routes';
import authRoutes from './src/modules/auth/api/auth.routes';
import { userRoutes } from './src/modules/user/api/user.routes';

// ─────────────────────────────────────────────────────────────

const preparePublicRoutes = (routes: Hapi.ServerRoute[]): Hapi.ServerRoute[] => {
  return routes.map((route) => ({
    ...route,
    options: {
      ...(route.options ?? {}),
      auth: false,
    },
  }));
};

const init = async () => {
  try {
    // 1. Connect MongoDB first
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voucher_app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 2. Init Hapi server
    const server: Hapi.Server = Hapi.server({
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
      routes: {
        cors: {
          origin: ['*'],
          additionalHeaders: ['authorization', 'content-type'],
          additionalExposedHeaders: ['authorization'],
          credentials: true,
        },
      },
      debug: {
        request: ['error', 'uncaught'],
      },
    });
    console.log('✅ Hapi server initialized');

    // 3. Health Check
    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: false,
        description: 'Health check',
        tags: ['api'],
        handler: () => ({ message: '🎉 Hapi server is running!' }),
      },
    });
    console.log('✅ Health check route registered');

    // 4. Register plugins
    await server.register([
      AuthJwtPlugin,
      ErrorHandlerPlugin,
      SwaggerPlugin,
      AgendaPlugin,
    ]);
    console.log('✅ Plugins registered');

    // 5. Register routes
    const publicAuthRoutes = preparePublicRoutes(authRoutes);
    server.route([...publicAuthRoutes, ...voucherRoutes, ...eventRoutes, ...userRoutes]);
    console.log('✅ Routes registered');

    // 6. Start server
    await server.start();
    console.log(`🚀 Server running at ${server.info.uri}`);
    console.log(`📚 Swagger docs at ${server.info.uri}/docs`);

    // 7. Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received. Cleaning up...');
      await mongoose.disconnect();
      await server.stop({ timeout: 10000 });
      console.log('👋 Server stopped cleanly.');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Catch unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

init();