# Shared Utils - Schemas

## 📁 File Structure

```
utils/
├── schemas.ts           # 🎯 SHARED SCHEMAS (Used across all modules)
├── README.md           # This documentation
├── PaginationQuery.ts  # Pagination utilities
├── response.ts         # Response utilities
├── errorHandler.ts     # Error handling utilities
├── responseFormatter.ts # Response formatting utilities
├── logger.ts           # Logging utilities
└── generateVoucherCode.ts # Voucher code generation
```

## 🎯 Shared Schemas Concept

### **Purpose:**
- **Reusability**: Schemas used across all modules
- **Consistency**: Ensure consistent format
- **DRY**: No code duplication
- **Maintainability**: Easy to update and maintain

### **Structure:**

```typescript
// utils/schemas.ts
export const baseSchemas = {
  objectId: Joi.string().length(24).required(),
  pagination: { page: Joi.number(), limit: Joi.number() },
  timestamps: { createdAt: Joi.date(), updatedAt: Joi.date() }
};

export const responseSchemas = {
  success: (dataSchema) => Joi.object({ success: Joi.boolean(), data: dataSchema }),
  error: Joi.object({ success: Joi.boolean(), message: Joi.string() })
};

export const swaggerResponses = {
  common: { 401: {...}, 404: {...}, 409: {...} }
};
```

## 🔧 How to Use

### **1. Import shared schemas:**
```typescript
// In module schemas (e.g., voucher.schemas.ts)
import { 
  baseSchemas, 
  responseSchemas, 
  swaggerResponses, 
  createResponseSchema 
} from '../../../../utils/schemas';
```

### **2. Use base schemas:**
```typescript
// Create input schema
export const inputSchemas = {
  params: {
    eventId: Joi.object({ eventId: baseSchemas.objectId })
  },
  query: {
    search: Joi.object({
      ...baseSchemas.pagination,
      ...baseSchemas.search
    })
  }
};
```

### **3. Use response schemas:**
```typescript
// Create response schema
export const voucherResponse = Joi.object({
  id: Joi.string(),
  eventId: Joi.string(),
  ...baseSchemas.timestamps,
  event: responseSchemas.objects.event.optional()
});
```

### **4. Use Swagger responses:**
```typescript
// In routes
plugins: {
  'hapi-swagger': {
    responses: {
      200: createResponseSchema.single(voucherResponse),
      401: swaggerResponses.common[401],
      404: swaggerResponses.common[404]
    }
  }
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

### **Helper Functions:**
- `createResponseSchema.single()`: Single item response
- `createResponseSchema.list()`: List with pagination
- `createResponseSchema.success()`: Simple success
- `createResponseSchema.error()`: Error response
- `generateSearchSchema()`: Dynamic search schema
- `createInputSchemas.params.id()`: ID parameter
- `createInputSchemas.query.basicSearch()`: Basic search
- `createInputSchemas.query.eventSearch()`: Event search
- `createInputSchemas.query.voucherSearch()`: Voucher search

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
