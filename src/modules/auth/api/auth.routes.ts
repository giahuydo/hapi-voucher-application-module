import { ServerRoute } from '@hapi/hapi';
import { loginHandler, registerHandler } from './auth.handler';
import { loginSchema, registerSchema } from './dto/auth.input';

const authRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/auth/register',
    options: {
      tags: ['api', 'auth'],
      description: 'Register a new user',
      notes: 'Create account and return JWT token',
      validate: {
        payload: registerSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      handler: registerHandler,
    },
  },
  {
    method: 'POST',
    path: '/auth/login',
    options: {
      tags: ['api', 'auth'],
      description: 'Login and get JWT token',
      notes: 'Verify credentials and return JWT',
      validate: {
        payload: loginSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      handler: loginHandler,
    },
  },
];

export default authRoutes;
