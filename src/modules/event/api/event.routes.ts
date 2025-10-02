import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  requestEditLock,
  releaseEditLock,
  maintainEditLock
} from './event.handler';

import {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema,
  getAllEventsQuerySchema,
} from '../dto/event.input';

import { eventSwaggerResponses } from './event.schemas';
import { sharedErrorSchemas } from '../../../../utils/schemas';

const eventRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/events',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event'],
      description: 'Get all events with optional filtering and pagination',
      notes: 'Requires authentication. Supports pagination, filtering by name, issuedCount, maxQuantity with numeric operators (gte, lte, gt, lt)',
      validate: {
        query: getAllEventsQuerySchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: getAllEvents,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: eventSwaggerResponses.listSuccess,
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            }
          }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/events/{eventId}',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event'],
      description: 'Get event by ID',
      notes: 'Requires authentication. Returns event details if found',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: getEventById,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: eventSwaggerResponses.singleSuccess,
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
    }
  },
  {
    method: 'POST',
    path: '/events',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event'],
      description: 'Create event',
      notes: 'Requires authentication. Creates a new event',
      validate: {
        payload: createEventSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: createEvent,
      plugins: {
        'hapi-swagger': {
          responses: {
            201: eventSwaggerResponses.createSuccess,
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
    }
  },
  {
    method: 'PUT',
    path: '/events/{eventId}',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event'],
      description: 'Update event',
      notes: 'Requires authentication. Updates an existing event',
      validate: {
        params: eventIdParamSchema,
        payload: updateEventSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: updateEvent,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: eventSwaggerResponses.updateSuccess,
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
    }
  },
  {
    method: 'DELETE',
    path: '/events/{eventId}',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event'],
      description: 'Delete event',
      notes: 'Requires authentication. Deletes an event permanently',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: deleteEvent,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: eventSwaggerResponses.deleteSuccess,
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
    }
  },
  {
    method: 'POST',
    path: '/events/{eventId}/editable/me',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event', 'edit-lock'],
      description: 'Request edit lock',
      notes: 'Requires authentication. Requests an edit lock for the event',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: requestEditLock,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Edit lock requested successfully',
              schema: Joi.object({
                success: Joi.boolean().default(true),
                message: Joi.string().default('Edit lock requested successfully')
              }).label('EditLockRequestedResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
            },
            409: {
              description: 'Conflict - Resource already exists or in invalid state',
              schema: sharedErrorSchemas.conflict
            }
          }
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/events/{eventId}/editable/release',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event', 'edit-lock'],
      description: 'Release edit lock',
      notes: 'Requires authentication. Releases the edit lock for the event',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: releaseEditLock,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Edit lock released successfully',
              schema: Joi.object({
                success: Joi.boolean().default(true),
                message: Joi.string().default('Edit lock released successfully')
              }).label('EditLockReleasedResponse')
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
    }
  },
  {
    method: 'POST',
    path: '/events/{eventId}/editable/maintain',
    options: {
      auth: 'jwt', // Require authentication
      tags: ['api', 'event', 'edit-lock'],
      description: 'Maintain edit lock',
      notes: 'Requires authentication. Maintains the edit lock for the event',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: maintainEditLock,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Edit lock maintained successfully',
              schema: Joi.object({
                success: Joi.boolean().default(true),
                message: Joi.string().default('Edit lock maintained successfully')
              }).label('EditLockMaintainedResponse')
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
    }
  }
];

export default eventRoutes;
