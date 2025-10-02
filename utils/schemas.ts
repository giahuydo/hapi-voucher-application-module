import Joi from 'joi';

// ============================================================================
// SHARED SCHEMAS - Used across all modules (voucher, event, user, etc.)
// ============================================================================

// Base schemas that can be reused across all modules
export const baseSchemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string()
    .length(24)
    .required()
    .description('MongoDB ObjectId'),

  // Optional ObjectId
  optionalObjectId: Joi.string()
    .length(24)
    .optional()
    .description('MongoDB ObjectId (optional)'),

  // Pagination parameters
  pagination: {
    page: Joi.number().integer().min(1).default(1).description('Page number for pagination'),
    limit: Joi.number().integer().min(1).max(100).default(10).description('Number of items per page'),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'code').default('createdAt').description('Sort field'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').description('Sort order'),
  },

  // Common timestamps
  timestamps: {
    createdAt: Joi.date().description('Creation timestamp'),
    updatedAt: Joi.date().description('Last update timestamp'),
  },

  // Common search parameters
  search: {
    search: Joi.string().min(1).description('General search across all searchable fields'),
    searchFields: Joi.string().description('JSON string of search fields: {"field": "value"}')
  }
};

// ============================================================================
// SHARED RESPONSE SCHEMAS
// ============================================================================

export const responseSchemas = {
  // Success response wrapper
  success: (dataSchema: Joi.Schema) => Joi.object({
    success: Joi.boolean().description('Operation success status'),
    message: Joi.string().description('Success message'),
    data: dataSchema
  }),

  // Error response wrapper
  error: Joi.object({
    success: Joi.boolean().description('Operation success status (false)'),
    message: Joi.string().description('Error message')
  }),

  // Pagination wrapper
  pagination: Joi.object({
    page: Joi.number().description('Current page number'),
    limit: Joi.number().description('Items per page'),
    total: Joi.number().description('Total number of items'),
    totalPages: Joi.number().description('Total number of pages'),
    hasNext: Joi.boolean().description('Whether there is a next page'),
    hasPrev: Joi.boolean().description('Whether there is a previous page')
  }).label('Pagination'),

  // Common object schemas
  objects: {
    // User object schema
    user: Joi.object({
      id: Joi.string().description('User ID'),
      name: Joi.string().description('User name'),
      email: Joi.string().email().description('User email'),
      role: Joi.string().description('User role'),
      ...baseSchemas.timestamps
    }).label('User'),

    // Event object schema
    event: Joi.object({
      id: Joi.string().description('Event ID'),
      name: Joi.string().description('Event name'),
      description: Joi.string().optional().description('Event description'),
      maxQuantity: Joi.number().description('Maximum number of vouchers for this event'),
      issuedCount: Joi.number().description('Number of vouchers already issued'),
      isActive: Joi.boolean().description('Whether the event is active'),
      ...baseSchemas.timestamps
    }).label('Event'),

    // Voucher object schema
    voucher: Joi.object({
      id: Joi.string().description('Voucher ID'),
      eventId: Joi.string().description('Associated event ID'),
      issuedTo: Joi.string().description('User ID who received the voucher'),
      code: Joi.string().description('Unique voucher code'),
      isUsed: Joi.boolean().description('Whether the voucher has been used'),
      ...baseSchemas.timestamps
    }).label('Voucher')
  }
};

// ============================================================================
// SHARED SWAGGER RESPONSES WITH PROPER LABELS
// ============================================================================

// Shared error response schemas with proper labels
export const sharedErrorSchemas = {
  // Standard error response
  error: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().description('Error message')
  }).label('ErrorResponse'),

  // Unauthorized error
  unauthorized: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().default('Unauthorized - Invalid or missing token')
  }).label('UnauthorizedResponse'),

  // Bad request error
  badRequest: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().default('Bad Request')
  }).label('BadRequestResponse'),

  // Not found error
  notFound: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().default('Resource not found')
  }).label('NotFoundResponse'),

  // Conflict error
  conflict: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().default('Conflict - Resource already exists or in invalid state')
  }).label('ConflictResponse'),

  // Validation error
  validation: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().default('Validation error'),
    errors: Joi.array().items(Joi.object({
      field: Joi.string(),
      message: Joi.string()
    })).optional()
  }).label('ValidationErrorResponse'),

  // Internal server error
  serverError: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().default('Internal Server Error')
  }).label('ServerErrorResponse')
};

// Legacy swagger responses - DEPRECATED, use sharedErrorSchemas instead
export const swaggerResponses = {
  // Common HTTP responses
  common: {
    200: { description: 'Success' },
    201: { description: 'Created successfully' },
    400: {
      description: 'Bad Request',
      schema: sharedErrorSchemas.badRequest
    },
    401: {
      description: 'Unauthorized - Invalid or missing token',
      schema: sharedErrorSchemas.unauthorized
    },
    403: {
      description: 'Forbidden - Insufficient permissions',
      schema: sharedErrorSchemas.error
    },
    404: {
      description: 'Resource not found',
      schema: sharedErrorSchemas.notFound
    },
    409: {
      description: 'Conflict - Resource already exists or in invalid state',
      schema: sharedErrorSchemas.conflict
    },
    422: {
      description: 'Validation error',
      schema: sharedErrorSchemas.validation
    },
    500: {
      description: 'Internal Server Error',
      schema: sharedErrorSchemas.serverError
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// New labeled response schema helpers
export const labeledResponseSchemas = {
  // Single item response with custom label
  single: (itemSchema: Joi.Schema, label: string) => Joi.object({
    success: Joi.boolean().default(true),
    message: Joi.string().description('Success message'),
    data: itemSchema
  }).label(label),
  
  // List response with pagination and custom label
  list: (itemSchema: Joi.Schema, label: string) => Joi.object({
    success: Joi.boolean().default(true),
    message: Joi.string().description('Success message'),
    data: Joi.object({
      data: Joi.array().items(itemSchema),
      pagination: responseSchemas.pagination
    }).label(`${label}Data`)
  }).label(label),
  
  // Simple success response with custom label
  success: (message: string, label: string) => Joi.object({
    success: Joi.boolean().default(true),
    message: Joi.string().default(message)
  }).label(label)
};

// Legacy create response schema - DEPRECATED, use labeledResponseSchemas instead
export const createResponseSchema = {
  // Single item response
  single: (itemSchema: Joi.Schema) => responseSchemas.success(itemSchema),
  
  // List response with pagination
  list: (itemSchema: Joi.Schema) => responseSchemas.success(Joi.object({
    data: Joi.array().items(itemSchema),
    pagination: responseSchemas.pagination
  })),
  
  // Simple success response
  success: (message?: string) => responseSchemas.success(Joi.object({
    message: Joi.string().default(message || 'Operation completed successfully')
  })),
  
  // Error response
  error: (message?: string) => responseSchemas.error.keys({
    message: Joi.string().default(message || 'An error occurred')
  })
};

// Generate search schema dynamically
export function generateSearchSchema(searchableFields: string[], additionalFields: Record<string, Joi.Schema> = {}) {
  const searchFields: Record<string, Joi.StringSchema> = {};
  searchableFields.forEach(field => {
    searchFields[`search.${field}`] = Joi.string().min(1).description(`Search by ${field} field`);
  });

  return Joi.object({
    ...baseSchemas.pagination,
    ...baseSchemas.search,
    ...additionalFields,
    ...searchFields
  }).unknown(true);
}
