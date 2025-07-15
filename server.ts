import Hapi from '@hapi/hapi';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Agenda } from 'agenda';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';
import * as HapiAuthJwt2 from 'hapi-auth-jwt2';

// Route modules
import voucherRoutes from './src/modules/voucher/api/voucher.routes';
import eventRoutes from './src/modules/event/api/event.routes';
import authRoutes from './src/modules/auth/api/auth.routes';

console.log('🔧 Initializing server...');
// Agenda job
import unlockVoucherLocksJob from './agenda/jobs/unlockVoucherLocks.job';

dotenv.config();

console.log('🔧 Starting server...');
// JWT validation function
const validateJWT = async (decoded: any, _request: Hapi.Request, _h: Hapi.ResponseToolkit) => {
  if (!decoded || !decoded.sub) return { isValid: false };
  return {
    isValid: true,
    credentials: { userId: decoded.sub }
  };
};

const init = async () => {
  try {
    const server = Hapi.server({
      port: process.env.PORT || 3000,
      host: '0.0.0.0'
    });
    console.log(`🔧 Initializing Hapi server on port ${server.settings.port}`);

    // Route test
    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: false,
        description: 'Health check',
        tags: ['api'],
        handler: () => ({ message: '🎉 Hapi server is running!' })
      }
    });

    // 🔐 Auth setup
    await server.register(HapiAuthJwt2);
    server.auth.strategy('jwt', 'jwt', {
      key: process.env.JWT_SECRET || 'default_secret',
      validate: validateJWT,
      verifyOptions: { algorithms: ['HS256'] }
    });
    console.log('✅ JWT auth strategy registered');

    // Swagger setup
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: {
          info: {
            title: 'Voucher Management API',
            version: '1.0.0',
            description: 'RESTful API for event-voucher system with JWT auth & Agenda job'
          },
          documentationPath: '/docs',
          tags: [
            { name: 'api', description: 'All API routes' },
            { name: 'auth', description: 'Authentication (public)' },
            { name: 'vouchers', description: 'Voucher operations' },
            { name: 'event', description: 'Event management' }
          ]
        }
      }
    ]);

    console.log('✅ Swagger documentation registered');
    // 🧩 Route registration (auth routes are public)
    const publicAuthRoutes: Hapi.ServerRoute[] = authRoutes.map(route => ({
      ...route,
      options: { ...route.options, auth: false }
    }));
    
    server.route([...publicAuthRoutes, ...voucherRoutes, ...eventRoutes]);
    
    
    // MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voucher_app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Start Hapi server
    await server.start();
    console.log(`🚀 Server running at ${server.info.uri}`);
    console.log(`📚 Swagger: ${server.info.uri}/docs`);

    // Agenda setup
    const agenda = new Agenda({
      mongo: mongoose.connection.db as any,
      processEvery: '1 minute'
    });
    unlockVoucherLocksJob(agenda);
    await agenda.start();
    console.log('✅ Agenda started');

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Handle rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

init();
