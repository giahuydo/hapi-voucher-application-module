# Shared Utils - Schemas

## 📁 File Structure

```
utils/
├── schemas.ts           # 🎯 SHARED RESPONSE SCHEMAS & BASE SCHEMAS
├── README.md           # This documentation
├── PaginationQuery.ts  # Pagination utilities
├── response.ts         # Response utilities
├── errorHandler.ts     # Error handling utilities
├── responseFormatter.ts # Response formatting utilities
├── logger.ts           # Logging utilities
└── generateVoucherCode.ts # Voucher code generation
```

## 🎯 Schema Architecture (Updated 2024)

### **New Approach - Pure Joi:**
- **Input schemas**: Defined directly in each module's `dto/` folder using pure Joi
- **Response schemas**: Shared in `utils/schemas.ts` for consistency
- **No helper functions**: Simple, direct Joi schema definitions
- **Better organization**: Clear separation between input and response schemas

### **Current Structure:**

```typescript
// utils/schemas.ts - RESPONSE SCHEMAS ONLY
export const baseSchemas = {
  objectId: Joi.string().length(24).required(),
  pagination: { page: Joi.number(), limit: Joi.number() },
  timestamps: { createdAt: Joi.date(), updatedAt: Joi.date() }
};

export const responseSchemas = {
  objects: {
    user: Joi.object({...}).label('User'),
    event: Joi.object({...}).label('Event'),
    voucher: Joi.object({...}).label('Voucher')
  }
};

export const sharedErrorSchemas = {
  UnauthorizedResponse: Joi.object({...}).label('UnauthorizedResponse'),
  NotFoundResponse: Joi.object({...}).label('NotFoundResponse'),
  // ... other error responses
};
```

```typescript
// src/modules/event/dto/event.input.ts - INPUT SCHEMAS
export const eventIdParamSchema = Joi.object({
  eventId: Joi.string().length(24).required().description('Event ID')
});

export const createEventSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().description('Event name'),
  description: Joi.string().max(1000).optional().description('Event description'),
  maxQuantity: Joi.number().integer().min(1).required().description('Maximum number of vouchers')
});
```

## 🔧 How to Use (Updated)

### **1. Input Schemas - Define in module's dto/ folder:**
```typescript
// src/modules/voucher/dto/voucher.input.ts
import Joi from 'joi';

export const IdVoucherParamsSchema = Joi.object({
  id: Joi.string().length(24).required().description('Voucher ID')
});

export const getAllVouchersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Page number'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Items per page'),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'code').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().min(1).description('Search across all fields'),
  eventId: Joi.string().length(24).description('Filter by event ID'),
  isUsed: Joi.boolean().description('Filter by usage status')
}).unknown(true);
```

### **2. Response Schemas - Use shared ones:**
```typescript
// src/modules/voucher/api/voucher.routes.ts
import { sharedErrorSchemas, labeledResponseSchemas } from '../../../../utils/schemas';

// In route responses:
responses: {
  200: labeledResponseSchemas.single(responseSchemas.objects.voucher, 'SingleVoucherResponse'),
  401: sharedErrorSchemas.UnauthorizedResponse,
  404: sharedErrorSchemas.NotFoundResponse
}
```

### **3. Direct Joi with Labels:**
```typescript
// In routes - direct Joi objects with labels
responses: {
  200: Joi.object({
    success: Joi.boolean().default(true),
    message: Joi.string().description('Success message'),
    data: responseSchemas.objects.voucher
  }).label('SingleVoucherResponse'),
  
  400: Joi.object({
    success: Joi.boolean().default(false),
    message: Joi.string().description('Error message')
  }).label('BadRequestResponse')
}
```

## 📊 Available Shared Schemas

### **Base Schemas:**
- `objectId`: MongoDB ObjectId validation
- `optionalObjectId`: Optional MongoDB ObjectId
- `pagination`: Page, limit, sortBy, sortOrder
- `timestamps`: createdAt, updatedAt
- `search`: General search and searchFields

### **Response Schemas:**
- `success(dataSchema)`: Success response wrapper
- `error`: Error response wrapper
- `pagination`: Pagination metadata
- `objects.user`: User object schema
- `objects.event`: Event object schema
- `objects.voucher`: Voucher object schema

### **Swagger Responses:**
- `common[200]`: Success
- `common[401]`: Unauthorized
- `common[404]`: Not found
- `common[409]`: Conflict
- `common[422]`: Validation error
- `common[500]`: Internal server error

## 🎨 Benefits

### **✅ DRY Principle:**
```typescript
// Before (repeated in each module)
objectId: Joi.string().length(24).required()

// After (shared)
import { baseSchemas } from '../../../../utils/schemas';
objectId: baseSchemas.objectId
```

### **✅ Consistency:**
```typescript
// All modules use same format
{
  success: true,
  message: "Operation completed",
  data: {...}
}
```

### **✅ Maintainability:**
```typescript
// Update once, affects all modules
// utils/schemas.ts
objectId: Joi.string().length(24).required().description('MongoDB ObjectId')
```

### **✅ Type Safety:**
```typescript
// TypeScript support
import { CreateEventInput } from './event.input';
const event: CreateEventInput = { name: 'Event', maxQuantity: 100 };
```

## 🚀 Best Practices

### **1. Use shared schemas when possible:**
```typescript
// ✅ Good
import { baseSchemas } from '../../../../utils/schemas';
const schema = Joi.object({ id: baseSchemas.objectId });

// ❌ Bad
const schema = Joi.object({ id: Joi.string().length(24).required() });
```

### **2. Create module-specific schemas for unique cases:**
```typescript
// ✅ Good
export const voucherSpecificSchema = Joi.object({
  code: Joi.string().description('Unique voucher code'),
  isUsed: Joi.boolean().description('Whether voucher is used')
});
```

### **3. Use helper functions:**
```typescript
// ✅ Good
schema: createResponseSchema.single(eventSchema)

// ❌ Bad
schema: Joi.object({
  success: Joi.boolean(),
  message: Joi.string(),
  data: eventSchema
})
```

### **4. Extend shared schemas:**
```typescript
// ✅ Good
export const extendedSchema = Joi.object({
  ...baseSchemas.timestamps,
  customField: Joi.string()
});
```

## 🔄 Migration Guide

### **From module-specific to shared:**

1. **Import shared schemas:**
```typescript
import { baseSchemas, responseSchemas } from '../../../../utils/schemas';
```

2. **Replace common patterns:**
```typescript
// Before
objectId: Joi.string().length(24).required()

// After
objectId: baseSchemas.objectId
```

3. **Use helper functions:**
```typescript
// Before
success: Joi.object({ success: Joi.boolean(), data: schema })

// After
success: createResponseSchema.single(schema)
```

4. **Keep module-specific schemas:**
```typescript
// Only keep what's unique to the module
export const voucherSpecificSchema = { ... };
```

## 📝 Examples

### **Voucher Module:**
```typescript
// voucher.schemas.ts
import { baseSchemas, responseSchemas, createResponseSchema } from '../../../../utils/schemas';

export const voucherResponse = Joi.object({
  id: Joi.string(),
  eventId: Joi.string(),
  ...baseSchemas.timestamps,
  event: responseSchemas.objects.event.optional()
});

export const voucherSwaggerResponses = {
  listSuccess: {
    schema: createResponseSchema.list(voucherResponse)
  }
};
```

### **Event Module:**
```typescript
// event.schemas.ts
import { baseSchemas, responseSchemas, createResponseSchema } from '../../../../utils/schemas';

export const eventResponse = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  ...baseSchemas.timestamps
});

export const eventSwaggerResponses = {
  singleSuccess: {
    schema: createResponseSchema.single(eventResponse)
  }
};
```

Now all modules use shared schemas, ensuring consistency and maintainability! 🎯
