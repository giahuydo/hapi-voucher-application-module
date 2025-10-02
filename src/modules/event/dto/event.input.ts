import Joi from 'joi';

export interface CreateEventInput {
  name: string;
  description?: string;
  maxQuantity: number;
  isActive?: boolean;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  maxQuantity?: number;
  isActive?: boolean;
}

/**
 * Path parameter schema for event ID
 * Used in: GET /events/{eventId}, PUT /events/{eventId}, DELETE /events/{eventId}
 */
export const eventIdParamSchema = Joi.object({
  eventId: Joi.string().length(24).required().description('Event ID')
});

/**
 * Query parameters for getting all events
 * Used in: GET /events
 */
export const getAllEventsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Page number'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Items per page'),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name').default('createdAt').description('Sort field'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').description('Sort order'),
  search: Joi.string().min(1).description('Search across all fields'),
  isActive: Joi.boolean().description('Filter by active status'),
  maxQuantity: Joi.number().description('Filter by max quantity')
}).unknown(true);

/**
 * Request body schema for creating an event
 * Used in: POST /events
 */
export const createEventSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().description('Event name'),
  description: Joi.string().max(1000).optional().description('Event description'),
  maxQuantity: Joi.number().integer().min(1).required().description('Maximum number of vouchers'),
  isActive: Joi.boolean().default(true).description('Whether the event is active')
});

/**
 * Request body schema for updating an event
 * Used in: PUT /events/{eventId}
 */
export const updateEventSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional().description('Event name'),
  description: Joi.string().max(1000).optional().description('Event description'),
  maxQuantity: Joi.number().integer().min(1).optional().description('Maximum number of vouchers'),
  isActive: Joi.boolean().optional().description('Whether the event is active')
});
