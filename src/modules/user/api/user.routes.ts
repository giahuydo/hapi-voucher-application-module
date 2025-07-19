import { ServerRoute } from '@hapi/hapi';
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
      tags: ['api', 'users'],
      description: 'Create a new user',
      notes: 'Creates and returns a new user',
      validate: {
        payload: createUserSchema,
      },
    },
  },
  {
    method: 'GET',
    path: '/users',
    handler: UserHandler.getAllUsersHandler,
    options: {
      tags: ['api', 'users'],
      description: 'Get all users',
      notes: 'Returns a list of all users',
    },
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: UserHandler.getUserByIdHandler,
    options: {
      tags: ['api', 'users'],
      description: 'Get user by ID',
      notes: 'Returns a user if found',
      validate: {
        params: idParamSchema,
      },
    },
  },
  {
    method: 'PUT',
    path: '/users/{id}',
    handler: UserHandler.updateUserHandler,
    options: {
      tags: ['api', 'users'],
      description: 'Update user by ID',
      notes: 'Updates user fields (excluding password)',
      validate: {
        params: idParamSchema,
        payload: updateUserSchema,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/users/{id}',
    handler: UserHandler.deleteUserHandler,
    options: {
      tags: ['api', 'users'],
      description: 'Delete user by ID',
      notes: 'Deletes a user permanently',
      validate: {
        params: idParamSchema,
      },
    },
  },
  {
    method: 'GET',
    path: '/users/me',
    options: {
      handler: UserHandler.getMeHandler,
      tags: ['api', 'user'],
      description: 'Get current user info'
    }
  }
];
