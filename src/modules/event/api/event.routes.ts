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
            200: {
              description: 'List of all events',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.array().items(Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  description: Joi.string(),
                  maxQuantity: Joi.number(),
                  issuedCount: Joi.number(),
                  isActive: Joi.boolean(),
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
            200: {
              description: 'Event details',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  description: Joi.string(),
                  maxQuantity: Joi.number(),
                  issuedCount: Joi.number(),
                  isActive: Joi.boolean(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'Event not found'
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
            201: {
              description: 'Event created successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  description: Joi.string(),
                  maxQuantity: Joi.number(),
                  issuedCount: Joi.number(),
                  isActive: Joi.boolean(),
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
            200: {
              description: 'Event updated successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  name: Joi.string(),
                  description: Joi.string(),
                  maxQuantity: Joi.number(),
                  issuedCount: Joi.number(),
                  isActive: Joi.boolean(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'Event not found'
            },
            400: {
              description: 'Validation error'
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
            200: {
              description: 'Event deleted successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string()
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'Event not found'
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
                success: Joi.boolean(),
                message: Joi.string()
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'Event not found'
            },
            409: {
              description: 'Event is already locked by another user'
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
                success: Joi.boolean(),
                message: Joi.string()
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'Event not found'
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
                success: Joi.boolean(),
                message: Joi.string()
              })
            },
            401: {
              description: 'Unauthorized - Invalid or missing token'
            },
            404: {
              description: 'Event not found'
            }
          }
        }
      }
    }
  }
];

export default eventRoutes;
