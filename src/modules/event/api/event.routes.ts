import { ServerRoute } from '@hapi/hapi';
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
  eventIdLockParamSchema,
} from '../dto/event.input';

import { User } from '../../user/user.model';

const eventRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/events',
    options: {
      tags: ['api', 'event'],
      description: 'Get all events',
      handler: getAllEvents
    }
  },
  {
    method: 'GET',
    path: '/events/{id}',
    options: {
      tags: ['api', 'event'],
      description: 'Get event by ID',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: getEventById
    }
  },
  {
    method: 'POST',
    path: '/events',
    options: {
      tags: ['api', 'event'],
      description: 'Create event',
      validate: {
        payload: createEventSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: createEvent
    }
  },
  {
    method: 'PUT',
    path: '/events/{id}',
    options: {
      tags: ['api', 'event'],
      description: 'Update event',
      validate: {
        params: eventIdParamSchema,
        payload: updateEventSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: updateEvent
    }
  },
  {
    method: 'DELETE',
    path: '/events/{id}',
    options: {
      tags: ['api', 'event'],
      description: 'Delete event',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: deleteEvent
    }
  },
  {
    method: 'POST',
    path: '/events/{eventId}/editable/me',
    options: {
      auth: 'jwt',
      tags: ['api', 'event', 'edit-lock'],
      description: 'Request edit lock',
      validate: {
        params: eventIdLockParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: requestEditLock
    }
  },
  {
    method: 'POST',
    path: '/events/{eventId}/editable/release',
    options: {
      auth: 'jwt',
      tags: ['api', 'event', 'edit-lock'],
      description: 'Release edit lock',
      validate: {
        params: eventIdLockParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: releaseEditLock
    }
  },
  {
    method: 'POST',
    path: '/events/{eventId}/editable/maintain',
    options: {
      auth: 'jwt',
      tags: ['api', 'event', 'edit-lock'],
      description: 'Maintain edit lock',
      validate: {
        params: eventIdLockParamSchema,
        failAction: (request, h, err) => { throw err; }
      },
      handler: maintainEditLock
    }
  }
];

export default eventRoutes;
