# Hapi Voucher Application Module

## 🎯 Overview

A robust Node.js application built with Hapi.js framework for managing voucher systems, events, and user authentication. Features include asynchronous job processing with Bull framework, comprehensive API documentation with Swagger, and a modular architecture.

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
npm install
```

### **2. Environment Setup**
```bash
cp env.example .env
# Edit .env with your configuration
```

### **3. Start Application**
```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

### **4. Start Workers (Background Processing)**
```bash
# Start all workers (email + voucher)
npm run workers

# Or start individually
npm run worker:email    # Email worker only
npm run worker:voucher  # Voucher worker only
```

### **5. Access Dashboard**
- **API**: http://localhost:3000
- **Queue Dashboard**: http://localhost:3000/admin/queues
- **Swagger Docs**: http://localhost:3000/documentation

## 📚 Documentation Navigation

### 🔧 **Core Application**
- **[API Documentation](./docs/API.md)** - Complete API endpoints and usage
- **[Database Schema](./docs/Database.md)** - MongoDB models and relationships
- **[Authentication](./docs/Auth.md)** - JWT authentication system

### 🏗️ **Architecture & Design**
- **[Project Structure](./docs/Structure.md)** - Codebase organization
- **[Module System](./docs/Modules.md)** - Modular architecture explanation
- **[Error Handling](./docs/ErrorHandling.md)** - Centralized error management

### 📊 **API & Validation**
- **[Swagger Documentation](./docs/Swagger.md)** - OpenAPI/Swagger setup
- **[Schema System](./docs/Schemas.md)** - Joi validation and Swagger schemas
- **[Response Formatting](./docs/Responses.md)** - Standardized API responses

### 🎫 **Voucher System**
- **[Voucher Module](./src/modules/voucher/README.md)** - Voucher management system
- **[Voucher Core](./docs/VoucherCore.md)** - Business logic implementation
- **[Voucher API](./src/modules/voucher/api/README.md)** - API endpoints and schemas

### 🎪 **Event System**
- **[Event Module](./src/modules/event/README.md)** - Event management system
- **[Event API](./src/modules/event/api/README.md)** - Event API documentation

### 👥 **User Management**
- **[User Module](./src/modules/user/README.md)** - User management system
- **[User API](./src/modules/user/api/README.md)** - User API documentation

### 🔐 **Authentication & Security**
- **[Auth Module](./src/modules/auth/README.md)** - Authentication system
- **[JWT Plugin](./docs/JWT.md)** - JWT implementation details

### ⚡ **Background Processing**
- **[Bull Framework](./jobs/README.md)** - Redis-based job queues
- **[Agenda Jobs](./agenda/README.md)** - MongoDB-based job scheduling
- **[Worker System](./docs/Workers.md)** - Background job processing

### 🛠️ **Development & Testing**
- **[Testing Guide](./docs/Testing.md)** - Unit and integration testing
- **[Development Setup](./docs/Development.md)** - Development environment
- **[Deployment](./docs/Deployment.md)** - Production deployment guide

### 📁 **Utilities & Helpers**
- **[Shared Schemas](./utils/README.md)** - Common Joi schemas
- **[Error Handler](./docs/ErrorHandler.md)** - Custom error classes
- **[Response Utils](./docs/ResponseUtils.md)** - Response formatting utilities

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Hapi Server                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Auth Module │  │User Module  │  │Event Module │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │Voucher Module│  │Swagger     │  │Error Handler│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Background Processing                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Bull Queue  │  │Agenda Jobs │  │Workers      │        │
│  │ (Redis)     │  │(MongoDB)   │  │(Processes)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  MongoDB    │  │   Redis     │  │   Logs      │        │
│  │ (Main DB)   │  │ (Queues)    │  │ (Files)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### ✨ **Core Features**
- **Voucher Management**: Create, issue, track, and manage vouchers
- **Event System**: Manage events with voucher allocation
- **User Management**: User registration, authentication, and profiles
- **Role-based Access**: JWT-based authentication with role management

### ⚡ **Performance Features**
- **Asynchronous Processing**: Bull framework with Redis for background jobs
- **Job Scheduling**: Agenda.js for recurring tasks and database health checks
- **Connection Pooling**: Optimized database connections
- **Caching**: Redis-based caching for frequently accessed data

### 🛡️ **Reliability Features**
- **Error Handling**: Centralized error management with custom error classes
- **Validation**: Joi schema validation for all inputs
- **Transaction Support**: MongoDB transactions for data consistency
- **Retry Logic**: Automatic retry for transient failures

### 📊 **Monitoring & Management**
- **Bull Board Dashboard**: Real-time queue monitoring at `/admin/queues`
- **API Documentation**: Interactive Swagger UI
- **Comprehensive Logging**: Structured logging with different levels
- **Health Checks**: Database connection monitoring

## 🔧 Technology Stack

### **Backend Framework**
- **Hapi.js**: Enterprise-grade Node.js web framework
- **TypeScript**: Type-safe JavaScript development
- **MongoDB**: NoSQL database with Mongoose ODM
- **Redis**: In-memory data store for queues and caching

### **Job Processing**
- **Bull**: Redis-based job queue for Node.js
- **Agenda.js**: MongoDB-based job scheduling
- **Worker Processes**: Separate processes for job execution

### **API & Documentation**
- **Swagger/OpenAPI**: Interactive API documentation
- **Joi**: Schema description and validation
- **JWT**: JSON Web Token authentication

### **Development & Testing**
- **Jest**: Testing framework
- **ESLint**: Code linting
- **ts-node-dev**: Development server with hot reload

## 📁 Project Structure

```
hapi-voucher-application-module/
├── src/                          # Source code
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── user/                 # User management
│   │   ├── event/                # Event management
│   │   └── voucher/              # Voucher system
│   ├── plugins/                  # Hapi plugins
│   └── types/                    # TypeScript types
├── jobs/                         # Background job processing
│   ├── queues/                   # Bull queues
│   ├── worker/                   # Job workers
│   └── services/                 # Job services
├── agenda/                       # Scheduled jobs
├── tests/                        # Test files
├── utils/                        # Shared utilities
└── docs/                         # Documentation
```

## 🚀 Getting Started

### 1. **Prerequisites**
- Node.js 16+ 
- MongoDB 4.4+
- Redis 6.0+
- npm or yarn

### 2. **Installation**
```bash
git clone <repository-url>
cd hapi-voucher-application-module
npm install
```

### 3. **Environment Setup**
```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. **Database Setup**
```bash
# Start MongoDB
mongod

# Start Redis
redis-server
```

### 5. **Run Application**
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### 6. **Start Workers**
```bash
# Terminal 1: Email worker
npm run worker

# Terminal 2: Voucher worker  
npm run worker:voucher
```

## 📊 API Endpoints

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### **Users**
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### **Events**
- `GET /events` - List events
- `POST /events` - Create event
- `GET /events/{id}` - Get event by ID
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

### **Vouchers**
- `GET /vouchers` - List vouchers
- `POST /vouchers/issue` - Issue voucher
- `GET /vouchers/{id}` - Get voucher by ID
- `PATCH /vouchers/{id}/use` - Mark voucher as used
- `PATCH /vouchers/{id}/release` - Release voucher lock
- `DELETE /vouchers/{id}` - Delete voucher

### **Admin & Monitoring**
- `GET /admin/queues` - Bull Board dashboard
- `GET /admin/queues/status` - Queue status API
- `POST /admin/queues/{queueName}/clean-failed` - Clean failed jobs
- `POST /admin/queues/{queueName}/retry-failed` - Retry failed jobs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/voucher/voucher.service.test.ts
```

## 📝 Development

### **Code Style**
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### **Type Checking**
```bash
# Check TypeScript types
npx tsc --noEmit
```

## 🚀 Deployment

### **Production Build**
```bash
npm run build
npm start
```

### **Environment Variables**
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/voucher-app
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the docs folder
- **Questions**: Review the README files in each module

---

**🎉 Welcome to the Hapi Voucher Application Module!**

For detailed information about specific components, use the navigation links above to explore the documentation. 
