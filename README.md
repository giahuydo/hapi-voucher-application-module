# 🎫 Hapi Voucher Application

A robust voucher management system built with Hapi.js, MongoDB, and Redis. Features real-time request monitoring, comprehensive filtering, and email notifications.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
# Clone repository
git clone <repository-url>
cd hapi-voucher-application-module

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials
```

### Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/voucher_app
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
JWT_SECRET=your-secret-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### Running the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Testing
npm test
```

## 📊 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **API Server** | `http://localhost:3000` | Main application |
| **Swagger Docs** | `http://localhost:3000/docs` | API documentation |
| **Telescope Dashboard** | `http://localhost:3000/telescope` | Real-time request monitoring |
| **Bull Board** | `http://localhost:3000/admin/queues` | Queue management |

## 🔧 Key Features

### Voucher Management
- Create, update, delete vouchers
- Issue vouchers to users
- Track usage and expiration
- Support for percentage and fixed amount vouchers

### Advanced Filtering
- Search by voucher code, recipient name, email
- Filter by status (Available, Used, Expired, Inactive)
- Filter by type (Fixed Amount, Percentage)
- Filter by event and date ranges
- Real-time filter options API

### Real-time Monitoring
- **Telescope Dashboard**: Live request/response monitoring
- **Pino Logger**: Structured JSON logging
- **Bull Board**: Queue management and monitoring

### Authentication & Security
- JWT-based authentication
- Role-based access control
- Request validation with Joi schemas
- CORS configuration

## 📝 API Endpoints

### Authentication
```
POST /auth/login          # User login
POST /auth/register       # User registration
POST /auth/refresh        # Refresh token
```

### Vouchers
```
GET    /vouchers                    # List vouchers with filters
POST   /vouchers                    # Create voucher
GET    /vouchers/{id}               # Get voucher details
PUT    /vouchers/{id}               # Update voucher
DELETE /vouchers/{id}               # Delete voucher
POST   /vouchers/issue              # Issue voucher to user
GET    /vouchers/filter-options     # Get filter options
```

### Events
```
GET    /events           # List events
POST   /events           # Create event
GET    /events/{id}      # Get event details
PUT    /events/{id}      # Update event
DELETE /events/{id}      # Delete event
```

## 🔍 Filtering & Search

### Query Parameters
```bash
# Pagination
?page=1&limit=10

# Sorting
?sortBy=createdAt&sortOrder=desc

# Search
?search=tech conference

# Filters
?status=available&type=fixed&eventId=123

# Date ranges
?createdFrom=2024-01-01&createdTo=2024-12-31
```

### Filter Options API
```bash
GET /vouchers/filter-options
```

Returns available events, voucher types, statuses, and statistics for building filter dropdowns.

## 🛠️ Development

### Project Structure
```
src/
├── modules/
│   ├── auth/           # Authentication
│   ├── voucher/        # Voucher management
│   ├── event/          # Event management
│   └── user/           # User management
├── plugins/            # Hapi plugins
│   ├── telescope.plugin.ts    # Request monitoring
│   ├── pino-logger.plugin.ts  # Structured logging
│   └── ...
└── config/             # Configuration files
```

### Adding New Features
1. Create module in `src/modules/`
2. Add routes in `src/modules/{module}/api/`
3. Implement service logic in `src/modules/{module}/`
4. Add validation schemas
5. Update tests

### Logging
- **Console**: Pretty formatted logs with colors
- **JSON**: Structured logs for production
- **Telescope**: Real-time web dashboard
- **Files**: Optional file logging

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- voucher.service.test.ts
```

## 📦 Production Deployment

### Docker (Optional)
```bash
# Build image
docker build -t voucher-app .

# Run container
docker run -p 3000:3000 voucher-app
```

### Environment Setup
1. Set production environment variables
2. Configure MongoDB and Redis
3. Set up email service (optional)
4. Configure logging levels
5. Set up monitoring and alerts

## 🔧 Troubleshooting

### Port Conflicts
```bash
# Kill processes using ports 3000-3005
./scripts/kill-ports.sh

# Or manually
lsof -ti:3000,3001 | xargs kill -9
```

### Common Issues
- **EADDRINUSE**: Port already in use - kill existing processes
- **MongoDB connection**: Check MONGO_URI in .env
- **Redis connection**: Check REDIS_URL in .env
- **JWT errors**: Verify JWT_SECRET is set

## 📚 Documentation

- **API Docs**: Available at `/docs` when server is running
- **Telescope Dashboard**: Real-time request monitoring at `/telescope`
- **Queue Management**: Bull Board at `/admin/queues`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.