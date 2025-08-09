import Joi from 'joi';
import { createInputSchemas } from '../../../../utils/schemas';

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
export const eventIdParamSchema = createInputSchemas.params.id('eventId');

/**
 * Query parameters for getting all events
 * Used in: GET /events
 */
export const getAllEventsQuerySchema = createInputSchemas.query.eventSearch;

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
