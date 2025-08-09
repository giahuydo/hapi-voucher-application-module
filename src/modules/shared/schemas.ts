import * as Joi from 'joi';

// Global shared schemas that can be used across all modules
export const globalSchemas = {
  // Success response wrapper
  successResponse: (dataSchema: Joi.Schema) => Joi.object({
    success: Joi.boolean(),
    message: Joi.string(),
    data: dataSchema
  }),

  // Error response wrapper
  errorResponse: Joi.object({
    success: Joi.boolean(),
    message: Joi.string()
  }),

  // Pagination schema
  paginationObject: Joi.object({
    page: Joi.number(),
    limit: Joi.number(),
    total: Joi.number(),
    totalPages: Joi.number(),
    hasNext: Joi.boolean(),
    hasPrev: Joi.boolean()
  }),

  // Common HTTP responses
  responses: {
    200: {
      description: 'Success'
    },
    201: {
      description: 'Created successfully'
    },
    400: {
      description: 'Bad Request',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string()
      })
    },
    401: {
      description: 'Unauthorized - Invalid or missing token',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string()
      })
    },
    403: {
      description: 'Forbidden - Insufficient permissions',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string()
      })
    },
    404: {
      description: 'Resource not found',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string()
      })
    },
    409: {
      description: 'Conflict - Resource already exists or in invalid state',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string()
      })
    },
    422: {
      description: 'Validation error',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string(),
        errors: Joi.array().items(Joi.object({
          field: Joi.string(),
          message: Joi.string()
        }))
      })
    },
    500: {
      description: 'Internal Server Error',
      schema: Joi.object({
        success: Joi.boolean(),
        message: Joi.string()
      })
    }
  },

  // Common object schemas
  objects: {
    // User object schema
    user: Joi.object({
      id: Joi.string(),
      name: Joi.string(),
      email: Joi.string().email(),
      role: Joi.string(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    }),

    // Event object schema
    event: Joi.object({
      id: Joi.string(),
      name: Joi.string(),
      description: Joi.string().optional(),
      maxQuantity: Joi.number(),
      issuedCount: Joi.number(),
      isActive: Joi.boolean(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    }),

    // Voucher object schema
    voucher: Joi.object({
      id: Joi.string(),
      eventId: Joi.string(),
      issuedTo: Joi.string(),
      code: Joi.string(),
      isUsed: Joi.boolean(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    })
  },

  // Common query parameters
  queryParams: {
    pagination: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10),
      sortBy: Joi.string().default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    }),

    search: Joi.object({
      search: Joi.string().optional(),
      filter: Joi.object().optional()
    })
  }
};

// Helper function to create consistent response schemas
export const createResponseSchema = {
  // Single item response
  single: (itemSchema: Joi.Schema) => globalSchemas.successResponse(itemSchema),
  
  // List response with pagination
  list: (itemSchema: Joi.Schema) => globalSchemas.successResponse(Joi.object({
    data: Joi.array().items(itemSchema),
    pagination: globalSchemas.paginationObject
  })),
  
  // Simple success response
  success: (message?: string) => globalSchemas.successResponse(Joi.object({
    message: Joi.string().default(message || 'Operation completed successfully')
  })),
  
  // Error response
  error: (message?: string) => globalSchemas.errorResponse.keys({
    message: Joi.string().default(message || 'An error occurred')
  })
};
