import * as Joi from 'joi';

/**
 * Input type for creating an event
 */
export interface CreateEventInput {
  name: string;
  maxQuantity: number;
}

export const createEventSchema = Joi.object<CreateEventInput>({
  name: Joi.string().min(2).required().description('Event name'),
  maxQuantity: Joi.number().min(1).required().description('Maximum number of vouchers'),
});

/**
 * Input type for updating an event
 */
export interface UpdateEventInput {
  name?: string;
  maxQuantity?: number;
}

export const updateEventSchema = Joi.object<UpdateEventInput>({
  name: Joi.string().min(2).optional().description('Event name'),
  maxQuantity: Joi.number().min(1).optional().description('Maximum number of vouchers'),
});

/**
 * Input for validating route params with { id }
 */
export interface EventIdParam {
  id: string;
}

/**
 * Validate route parameter: eventId (MongoDB ObjectId)
 */
export const eventIdParamSchema = Joi.object({
  eventId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .description('MongoDB ObjectId of the event'),
});

/**
 * Generate dynamic search schema for events with numeric operators
 */
export function generateEventSearchSchema() {
  return Joi.object({
    page: Joi.number().integer().min(1).default(1).description('Page number for pagination'),
    limit: Joi.number().integer().min(1).max(100).default(10).description('Number of items per page'),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'issuedCount', 'maxQuantity').default('createdAt').description('Sort field'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').description('Sort order'),
    search: Joi.string().min(1).description('General search across all searchable fields'),
    
    // String search fields
    'search.name': Joi.string().min(1).description('Search events by name'),
    
    // Numeric search fields with operators
    'search.issuedCount': Joi.string().min(1).description('Search events by issuedCount (exact match)'),
    'search.issuedCount.gte': Joi.number().description('Search events with issuedCount >= value'),
    'search.issuedCount.lte': Joi.number().description('Search events with issuedCount <= value'),
    'search.issuedCount.gt': Joi.number().description('Search events with issuedCount > value'),
    'search.issuedCount.lt': Joi.number().description('Search events with issuedCount < value'),
    
    'search.maxQuantity': Joi.string().min(1).description('Search events by maxQuantity (exact match)'),
    'search.maxQuantity.gte': Joi.number().description('Search events with maxQuantity >= value'),
    'search.maxQuantity.lte': Joi.number().description('Search events with maxQuantity <= value'),
    'search.maxQuantity.gt': Joi.number().description('Search events with maxQuantity > value'),
    'search.maxQuantity.lt': Joi.number().description('Search events with maxQuantity < value'),
    
    // Alternative: JSON string for complex search
    searchFields: Joi.string().description('JSON string of search fields with operators: {"issuedCount": {"$gte": 10, "$lte": 50}}')
  }).unknown(true);
}

/**
 * Query parameters for getting all events
 * Used in: GET /api/events
 */
export const getAllEventsQuerySchema = generateEventSearchSchema();
