# Configuration System

Simple configuration system for the Voucher Application.

## Usage

### Basic Usage

```typescript
import config from '../config';

// Access configuration
const port = config.app.port;
const jwtSecret = config.auth.jwt.secret;
const mongoUri = config.database.mongo.uri;
```

### Using Config Utils

```typescript
import { ConfigUtils } from '../config/utils';

// Check environment
if (ConfigUtils.isDevelopment()) {
  console.log('Running in development mode');
}

// Get specific config
const jwtConfig = ConfigUtils.getJWTConfig();
const mongoConnectionString = ConfigUtils.getMongoConnectionString();
```

## Environment Variables

### Required Variables

```bash
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/voucher_app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Optional Variables

See `env.example` for complete list of available environment variables.

## Configuration Categories

- **App**: Application name, environment, port, host, URL
- **Database**: MongoDB connection settings
- **Redis**: Redis connection settings
- **Auth**: JWT and bcrypt configuration
- **Email**: SMTP configuration
- **Queue**: Bull queue configuration
- **Logging**: Log levels and file settings
- **Rate Limit**: Request limits and time windows
- **CORS**: Allowed origins, methods, headers
- **Business**: Voucher, event, and pagination settings

## Migration from Hardcoded Values

### Before (Hardcoded)
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '7d' });
```

### After (Configuration)
```typescript
import config from '../config';

const token = jwt.sign(
  { sub: user._id }, 
  config.auth.jwt.secret, 
  { expiresIn: config.auth.jwt.expiresIn }
);
```

## Best Practices

1. **Never hardcode values** - Use config instead
2. **Use environment-specific settings** - Check environment with `ConfigUtils.isDevelopment()`
3. **Use type-safe access** - Access config properties directly
4. **Set required environment variables** - Check `env.example` for complete list