# Hapi Voucher Application

A Node.js application built with Hapi.js for voucher management system with email notifications and background job processing.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm run build
npm start

# Testing
npm test
```

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Hapi.js (v21.4.0)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Queue System**: Bull (Redis-based)
- **Scheduler**: Agenda (MongoDB-based)
- **Email**: Nodemailer
- **Validation**: Joi
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI

### Architecture Pattern
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer     │    │  Service Layer  │    │  Data Layer     │
│   (Hapi.js)     │───▶│  (Business      │───▶│  (MongoDB)      │
│                 │    │   Logic)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Background     │    │  Queue System   │    │  Scheduled      │
│  Jobs (Bull)    │    │  (Redis)        │    │  Jobs (Agenda)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
hapi-voucher-application/
├── src/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── controller.ts
│   │   │   ├── routes.ts
│   │   │   └── validator.ts
│   │   ├── event/
│   │   │   ├── controller.ts
│   │   │   ├── routes.ts
│   │   │   └── validator.ts
│   │   └── voucher/
│   │       ├── controller.ts
│   │       ├── routes.ts
│   │       └── validator.ts
│   ├── models/
│   │   ├── event.model.ts
│   │   ├── user.model.ts
│   │   └── voucher.model.ts
│   └── services/
│       ├── auth.service.ts
│       └── voucher.service.ts
├── agenda/
│   ├── agenda.instance.ts
│   └── jobs/
│       └── unlockVoucherLocks.job.ts
├── jobs/
│   ├── queues/
│   │   └── email.queue.ts
│   ├── services/
│   │   └── email.service.ts
│   └── worker/
│       └── email.worker.ts
├── tests/
│   ├── setup.ts
│   ├── unit/
│   │   └── services/
│   │       └── voucher.service.test.ts
│   └── integration/
│       └── api/
│           └── voucher.test.ts
├── server.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 📊 API Documentation

### Interactive API Documentation
Access the complete interactive API documentation at: **`http://localhost:3000/documentation`**

The Swagger UI provides:
- ✅ All available endpoints
- ✅ Request/response schemas
- ✅ Authentication requirements
- ✅ Interactive testing
- ✅ Example requests and responses

### Available Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

#### Events
- `GET /events` - List all events
- `POST /events` - Create new event
- `GET /events/{id}` - Get event by ID
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

#### Vouchers
- `GET /vouchers` - List all vouchers
- `POST /events/{eventId}/vouchers` - Request voucher for event
- `GET /vouchers/{id}` - Get voucher by ID
- `PUT /vouchers/{id}` - Update voucher
- `DELETE /vouchers/{id}` - Delete voucher

## 🧪 Testing

### Test Setup

```bash
# Install test dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── unit/                       # Unit tests
│   └── services/
│       └── voucher.service.test.ts
└── integration/                # Integration tests
    └── api/
        └── voucher.test.ts
```

### Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
```

## 🔧 Development Guide

### Environment Setup

Create `.env` file:
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/voucher_app
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npx tsc --noEmit
```

## 🚀 Deployment

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://production-db:27017/voucher_app
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=24h
EMAIL_USER=production@example.com
EMAIL_PASS=app-password
REDIS_HOST=redis-server
REDIS_PORT=6379
```

## 📚 Documentation Links

- [Hapi.js Documentation](https://hapi.dev/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Agenda Documentation](https://github.com/agenda/agenda)
- [Jest Documentation](https://jestjs.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Joi Validation Documentation](https://joi.dev/)
- [JWT Documentation](https://jwt.io/)
- [Swagger/OpenAPI Documentation](https://swagger.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

ISC License 
