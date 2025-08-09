import Joi from 'joi';
import { 
  baseSchemas, 
  responseSchemas, 
  swaggerResponses, 
  createResponseSchema, 
  createInputSchemas 
} from '../../../../utils/schemas';

// ============================================================================
// EVENT-SPECIFIC SCHEMAS
// ============================================================================

// Event-specific input schemas
export const inputSchemas = {
  // Path parameters
  params: {
    eventId: createInputSchemas.params.id('eventId'),
  },

  // Query parameters
  query: {
    eventSearch: createInputSchemas.query.eventSearch,
  },

  // Request body schemas
  body: {
    createEvent: Joi.object({
      name: Joi.string().min(1).max(255).required().description('Event name'),
      description: Joi.string().max(1000).optional().description('Event description'),
      maxQuantity: Joi.number().integer().min(1).required().description('Maximum number of vouchers'),
      isActive: Joi.boolean().default(true).description('Whether the event is active')
    }),

    updateEvent: Joi.object({
      name: Joi.string().min(1).max(255).optional().description('Event name'),
      description: Joi.string().max(1000).optional().description('Event description'),
      maxQuantity: Joi.number().integer().min(1).optional().description('Maximum number of vouchers'),
      isActive: Joi.boolean().optional().description('Whether the event is active')
    })
  }
};

// Event-specific response schemas
export const eventResponseSchemas = {
  // Event object
  event: responseSchemas.objects.event,

  // Event with voucher count
  eventWithStats: Joi.object({
    id: Joi.string().description('Event ID'),
    name: Joi.string().description('Event name'),
    description: Joi.string().optional().description('Event description'),
    maxQuantity: Joi.number().description('Maximum number of vouchers for this event'),
    issuedCount: Joi.number().description('Number of vouchers already issued'),
    isActive: Joi.boolean().description('Whether the event is active'),
    ...baseSchemas.timestamps,
    // Additional stats
    availableCount: Joi.number().description('Number of vouchers still available'),
    usagePercentage: Joi.number().description('Percentage of vouchers used')
  })
};

// ============================================================================
// EVENT-SPECIFIC SWAGGER RESPONSES
// ============================================================================

export const eventSwaggerResponses = {
  // Create event response
  createSuccess: {
    description: 'Event created successfully',
    schema: createResponseSchema.single(eventResponseSchemas.event)
  },

  // Get event list response
  listSuccess: {
    description: 'List of all events',
    schema: createResponseSchema.single(Joi.object({
      data: Joi.array().items(eventResponseSchemas.event),
      meta: Joi.object({
        total: Joi.number(),
        page: Joi.number(),
        limit: Joi.number(),
        totalPages: Joi.number(),
        hasNextPage: Joi.boolean(),
        hasPrevPage: Joi.boolean(),
        nextPage: Joi.number().allow(null),
        prevPage: Joi.number().allow(null)
      })
    }))
  },

  // Get single event response
  singleSuccess: {
    description: 'Event details',
    schema: createResponseSchema.single(eventResponseSchemas.event)
  },

  // Update event response
  updateSuccess: {
    description: 'Event updated successfully',
    schema: createResponseSchema.single(eventResponseSchemas.event)
  },

  // Delete event response
  deleteSuccess: {
    description: 'Event deleted successfully',
    schema: createResponseSchema.success('Event deleted successfully')
  }
};

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

// Legacy schemas for backward compatibility
export const eventSchemas = {
  eventObject: eventResponseSchemas.event,
  eventWithStats: eventResponseSchemas.eventWithStats,
  paginationObject: responseSchemas.pagination,
  successResponse: responseSchemas.success,
  errorResponse: responseSchemas.error,
  responses: {
    401: swaggerResponses.common[401],
    404: swaggerResponses.common[404],
    409: swaggerResponses.common[409]
  }
};
