import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import { loginHandler, registerHandler } from './auth.handler';
import { loginSchema, registerSchema } from '../dto/auth.input';

const authRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/auth/register',
    options: {
      tags: ['api', 'auth'],
      description: 'Register a new user',
      notes: 'Create account and return JWT token. Copy the token from the response and use it in the Authorize button above.',
      auth: false, // Public endpoint
      validate: {
        payload: registerSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        'hapi-swagger': {
          security: [], // Override default security - no auth required
          responses: {
            201: {
              description: 'User registered successfully - Copy the token from data.token',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  token: Joi.string().description('JWT token - Copy this value and paste in Authorize modal'),
                  user: Joi.object({
                    id: Joi.string(),
                    name: Joi.string(),
                    email: Joi.string().email(),
                    role: Joi.string()
                  })
                })
              })
            },
            400: {
              description: 'Validation error or email already exists',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string()
              })
            }
          }
        }
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
      notes: 'Verify credentials and return JWT token. Copy the token from the response and click the Authorize button above to set it.',
      auth: false, // Public endpoint
      validate: {
        payload: loginSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        'hapi-swagger': {
          security: [], // Override default security - no auth required
          responses: {
            200: {
              description: 'Login successful - Copy the token value and paste in Authorize modal',
              schema: Joi.object({
                success: Joi.boolean(),
                token: Joi.string().description('JWT token - Copy this value and paste in Authorize modal (without Bearer prefix)'),
                user: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  email: Joi.string().email(),
                  role: Joi.string()
                })
              })
            },
            401: {
              description: 'Invalid credentials',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string()
              })
            }
          }
        }
      },
      handler: loginHandler,
    },
  },
];

export default authRoutes;
