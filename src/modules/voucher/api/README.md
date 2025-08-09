# Voucher Module - Unified Schemas

## 📁 File Structure

```
src/modules/voucher/
├── api/
│   ├── voucher.schemas.ts    # 🎯 UNIFIED SCHEMAS (Input + Swagger)
│   ├── voucher.routes.ts     # Routes using unified schemas
│   └── voucher.handler.ts    # Route handlers
├── dto/
│   ├── voucher.input.ts      # Input validation (imports from schemas)
│   └── voucher.dto.ts        # TypeScript interfaces
└── ...
```

## 🎯 Unified Schemas Concept

### **Before (2 separate files):**
```typescript
// voucher.input.ts - Only for validation
export const eventIdParamSchema = Joi.object({
  eventId: Joi.string().length(24).required()
});

// voucher.schemas.ts - Only for Swagger
export const voucherObject = Joi.object({
  id: Joi.string(),
  eventId: Joi.string(),
  // ...
});
```

### **Now (1 unified file):**
```typescript
// voucher.schemas.ts - Both validation + Swagger
export const baseSchemas = {
  objectId: Joi.string().length(24).required().description('MongoDB ObjectId')
};

export const inputSchemas = {
  params: {
    eventId: Joi.object({ eventId: baseSchemas.objectId })
  }
};

export const responseSchemas = {
  voucher: Joi.object({
    id: Joi.string().description('Voucher ID'),
    eventId: Joi.string().description('Associated event ID'),
    // ...
  })
};
```

## 🔧 How to Use

### **1. Input Validation (Routes):**
```typescript
// voucher.routes.ts
import { inputSchemas } from './voucher.schemas';

validate: {
  params: inputSchemas.params.eventId,  // ✅ Reuse base schema
  query: inputSchemas.query.voucherSearch
}
```

### **2. Swagger Documentation:**
```typescript
// voucher.routes.ts
import { swaggerResponses } from './voucher.schemas';

plugins: {
  'hapi-swagger': {
    responses: {
      200: swaggerResponses.voucher.listSuccess,  // ✅ Predefined response
      401: swaggerResponses.common[401]           // ✅ Common response
    }
  }
}
```

### **3. Helper Functions:**
```typescript
// voucher.routes.ts
import { createResponseSchema } from './voucher.schemas';

schema: createResponseSchema.error('Custom error message')
```

## 🎨 Benefits

### **✅ DRY Principle:**
- No code duplication
- Base schemas are reused

### **✅ Consistency:**
- Same format for all responses
- Same validation rules

### **✅ Maintainability:**
- One place to update schemas
- Easy to refactor and extend

### **✅ Type Safety:**
- TypeScript support
- IntelliSense support

### **✅ Clean Code:**
- Short routes
- Easy to read and understand

## 📊 Before vs After

### **Before (200+ lines):**
```typescript
schema: Joi.object({
  success: Joi.boolean(),
  message: Joi.string(),
  data: Joi.object({
    id: Joi.string(),
    eventId: Joi.string(),
    // ... 20+ lines
  })
})
```

### **After (1 line):**
```typescript
schema: swaggerResponses.voucher.singleSuccess
```

## 🚀 Best Practices

1. **Use base schemas** for common patterns
2. **Create predefined responses** for common cases
3. **Use helper functions** for dynamic cases
4. **Keep schemas close** to where they're used
5. **Document with descriptions** for better Swagger UI

## 🔄 Migration Guide

When creating new modules:

1. **Create `module.schemas.ts`** with unified structure
2. **Import schemas** in routes
3. **Use predefined responses** when possible
4. **Extend base schemas** for specific needs
