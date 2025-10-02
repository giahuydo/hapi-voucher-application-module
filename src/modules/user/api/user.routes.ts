import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import * as UserHandler from './user.handler';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from '../dto/user.input';
import { 
  responseSchemas, 
  sharedErrorSchemas,
  labeledResponseSchemas,
  swaggerResponses,
  createResponseSchema
} from '../../../../utils/schemas';

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
              schema: labeledResponseSchemas.single(responseSchemas.objects.user, 'CreateUserResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            400: {
              description: 'Bad Request',
              schema: sharedErrorSchemas.badRequest
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
              schema: labeledResponseSchemas.list(responseSchemas.objects.user, 'UserListResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
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
              schema: labeledResponseSchemas.single(responseSchemas.objects.user, 'SingleUserResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
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
              schema: labeledResponseSchemas.single(responseSchemas.objects.user, 'UpdateUserResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
            },
            400: {
              description: 'Bad Request',
              schema: sharedErrorSchemas.badRequest
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
              schema: labeledResponseSchemas.success('User deleted successfully', 'DeleteUserResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
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
              schema: labeledResponseSchemas.single(responseSchemas.objects.user, 'CurrentUserResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            }
          }
        }
      }
    }
  }
];
