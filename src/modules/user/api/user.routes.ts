import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import * as UserHandler from './user.handler';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from '../dto/user.input';

export const userRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/users',
    handler: UserHandler.createUserHandler,
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'users'],
      description: 'Create a new user',
      notes: 'Requires authentication. Creates and returns a new user',
      validate: {
        payload: createUserSchema,
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            201: {
              description: 'User created successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  email: Joi.string().email(),
                  role: Joi.string(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            400: {
              description: 'Validation error'
            }
          }
        }
      }
    },
  },
  {
    method: 'GET',
    path: '/users',
    handler: UserHandler.getAllUsersHandler,
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'users'],
      description: 'Get all users',
      notes: 'Requires authentication. Returns a list of all users',
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'List of all users',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.array().items(Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  email: Joi.string().email(),
                  role: Joi.string(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                }))
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            }
          }
        }
      }
    },
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: UserHandler.getUserByIdHandler,
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'users'],
      description: 'Get user by ID',
      notes: 'Requires authentication. Returns a user if found',
      validate: {
        params: idParamSchema,
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'User details',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  email: Joi.string().email(),
                  role: Joi.string(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'User not found'
            }
          }
        }
      }
    },
  },
  {
    method: 'PUT',
    path: '/users/{id}',
    handler: UserHandler.updateUserHandler,
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'users'],
      description: 'Update user by ID',
      notes: 'Requires authentication. Updates user fields (excluding password)',
      validate: {
        params: idParamSchema,
        payload: updateUserSchema,
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'User updated successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  email: Joi.string().email(),
                  role: Joi.string(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'User not found'
            },
            400: {
              description: 'Validation error'
            }
          }
        }
      }
    },
  },
  {
    method: 'DELETE',
    path: '/users/{id}',
    handler: UserHandler.deleteUserHandler,
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'users'],
      description: 'Delete user by ID',
      notes: 'Requires authentication. Deletes a user permanently',
      validate: {
        params: idParamSchema,
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'User deleted successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string()
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'User not found'
            }
          }
        }
      }
    },
  },
  {
    method: 'GET',
    path: '/users/me',
    options: {
      auth: 'jwt', // Require authentication
      handler: UserHandler.getMeHandler,
      tags: ['api', 'users'],
      description: 'Get current user info',
      notes: 'Requires authentication. Returns the authenticated user\'s information',
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Current user details',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  email: Joi.string().email(),
                  role: Joi.string(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            }
          }
        }
      }
    }
  }
];
