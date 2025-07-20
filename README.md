# Hapi Voucher Application Module

## Purpose
- Manage voucher issuance per event, ensuring the maximum quantity is never exceeded.
- Use MongoDB transactions for data consistency and safety.
- Demonstrate transaction handling, locking, and concurrent request safety in a real-world scenario.
- Learn about database transactions, shared transactions, and locked transactions in MongoDB.

## Architecture Overview

### Core Components
- **Event Management**: Define maximum voucher quantities per event
- **Voucher Issuance**: Atomic transaction-based voucher generation
- **Concurrency Control**: Handle multiple simultaneous requests safely
- **Email Notifications**: Background job processing for voucher delivery

### Transaction Safety
- **MongoDB Transactions**: Ensure data consistency across voucher creation and event updates
- **Retry Logic**: Handle transient transaction errors (collisions) with automatic retry
- **Concurrent Request Handling**: Prevent over-issuing when multiple users request simultaneously

## Test Structure

### Unit Tests
- **Voucher Service Tests**: Core business logic validation
- **Event Service Tests**: Event management functionality
- **User Service Tests**: User management operations
- **Transaction Tests**: Database transaction safety

### Integration Tests
- **API Endpoint Tests**: Full request/response cycle validation
- **Database Integration**: Real MongoDB operations with test data

## Key Voucher Tests

### Core Functionality
- **Successful voucher issuance**: When quantity remains, a user receives a new voucher code
- **Out of stock handling**: If all vouchers are issued, respond with error 456
- **Transaction retry**: On transient transaction errors (e.g., collisions), the service automatically retries
- **Concurrent requests**: When multiple users request vouchers simultaneously, only one receives a voucher; others get error 456 (no over-issuing)

### Error Handling
- **Validation errors**: Invalid event ID format
- **Not found errors**: Event doesn't exist
- **Business logic errors**: Voucher exhausted (status 456)
- **Transient errors**: MongoDB transaction conflicts with automatic retry

## Test Results

### Current Test Status
```
✓ should issue voucher if event has quantity left
✕ should throw 456 if event is out of vouchers (status property missing)
✓ should retry transaction on transient error and succeed
✕ should only issue up to maxQuantity vouchers even with concurrent requests
✓ should throw NotFoundError if event does not exist
✓ should issue voucher but not send email if user has no email
```

### Known Issues
- **AppError status property**: Some error instances missing status code (456)
- **Concurrent request handling**: Need to ensure proper error status codes

## How to Run Tests

### Prerequisites
```bash
npm install
npm install --save-dev ts-jest @types/jest
```

### Test Commands
```bash
# Run all tests
npx jest

# Run specific test file
npx jest tests/unit/voucher/issueVoucher.spec.ts --verbose

# Run with coverage
npx jest --coverage

# Clear cache and run
npx jest --clearCache
```

### Test Configuration
```js
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
```

## API Endpoints

### Voucher Management
- `POST /events/{eventId}/vouchers` - Request voucher for event
- `GET /vouchers` - List all vouchers
- `GET /vouchers/{id}` - Get voucher by ID
- `PUT /vouchers/{id}/use` - Mark voucher as used

### Event Management
- `GET /events` - List all events
- `POST /events` - Create new event
- `GET /events/{id}` - Get event by ID
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

## Database Schema

### Event Model
```typescript
interface EventDocument {
  name: string;
  maxQuantity: number;
  issuedCount: number;
  createdAt: Date;
  editingBy: string | null;
  editLockAt: Date | null;
}
```

### Voucher Model
```typescript
interface VoucherDocument {
  eventId: ObjectId;
  code: string;
  issuedTo: string;
  isUsed: boolean;
  createdAt: Date;
}
```

## Transaction Flow

### Voucher Issuance Process
1. **Start Transaction**: Begin MongoDB session
2. **Validate Event**: Check if event exists and has available vouchers
3. **Create Voucher**: Generate unique voucher code
4. **Update Event**: Increment issuedCount atomically
5. **Commit Transaction**: Ensure all operations succeed or fail together
6. **Send Email**: Queue background job for voucher delivery

### Error Handling
- **ValidationError**: Invalid input parameters
- **NotFoundError**: Event not found
- **AppError (456)**: Voucher exhausted
- **TransientTransactionError**: Automatic retry on MongoDB conflicts

## Development Notes

### Test Notes
- **eventId** must be a valid ObjectId (24 hex characters), e.g., `'507f1f77bcf86cd799439011'`
- All tests mock the database; no real MongoDB connection is required
- When adding new tests, ensure you mock `.session()` methods if using transactions

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code style and quality enforcement
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive testing framework

### Environment Setup
```bash
# Development
npm run dev

# Production
npm run build
npm start

# Testing
npm test
npm run test:watch
npm run test:coverage
```

## References
- [MongoDB Transaction & Retry Pattern](https://docs.mongodb.com/v4.0/core/transactions/#retry-commit-operation)
- [Jest Documentation](https://jestjs.io/)
- [Hapi.js Documentation](https://hapi.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/) 
