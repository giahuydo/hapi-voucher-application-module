import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'REDIS_HOST',
  'REDIS_PORT'
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Configuration interface
export interface Config {
  app: {
    name: string;
    env: 'development' | 'staging' | 'production' | 'test';
    port: number;
    host: string;
    url: string;
  };
  database: {
    mongo: {
      uri: string;
      dbName: string;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  auth: {
    jwt: {
      secret: string;
      expiresIn: string;
    };
    bcrypt: {
      saltRounds: number;
    };
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
  queue: {
    bull: {
      redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
      };
      defaultJobOptions: {
        attempts: number;
        backoff: {
          type: 'fixed' | 'exponential';
          delay: number;
        };
        removeOnComplete: number;
        removeOnFail: number;
      };
    };
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
    file: {
      enabled: boolean;
      filename: string;
    };
    console: {
      enabled: boolean;
    };
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
  };
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  business: {
    voucher: {
      codeLength: number;
      codePrefix: string;
      maxRetries: number;
      lockTimeout: number;
    };
    event: {
      editLockTimeout: number;
      maxConcurrentEdits: number;
    };
    pagination: {
      defaultLimit: number;
      maxLimit: number;
    };
  };
}

// Create configuration object
const config: Config = {
  app: {
    name: process.env.APP_NAME || 'Voucher Application',
    env: (process.env.NODE_ENV as Config['app']['env']) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    url: process.env.APP_URL || `http://localhost:${process.env.PORT || '3000'}`,
  },
  database: {
    mongo: {
      uri: process.env.MONGO_URI!,
      dbName: process.env.MONGO_DB_NAME || 'voucher_app',
    },
  },
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
  },
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    },
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
    from: process.env.EMAIL_FROM || 'Voucher App <no-reply@voucherapp.com>',
  },
  queue: {
    bull: {
      redis: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
      },
      defaultJobOptions: {
        attempts: parseInt(process.env.QUEUE_ATTEMPTS || '3', 10),
        backoff: {
          type: (process.env.QUEUE_BACKOFF_TYPE as 'fixed' | 'exponential') || 'exponential',
          delay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '2000', 10),
        },
        removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '100', 10),
        removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '50', 10),
      },
    },
  },
  logging: {
    level: (process.env.LOG_LEVEL as Config['logging']['level']) || 'info',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      filename: process.env.LOG_FILE || 'logs/app.log',
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: (process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE').split(','),
    allowedHeaders: (process.env.CORS_ALLOWED_HEADERS || 'Origin,X-Requested-With,Content-Type,Accept,Authorization').split(','),
  },
  business: {
    voucher: {
      codeLength: parseInt(process.env.VOUCHER_CODE_LENGTH || '8', 10),
      codePrefix: process.env.VOUCHER_CODE_PREFIX || 'VC',
      maxRetries: parseInt(process.env.VOUCHER_MAX_RETRIES || '3', 10),
      lockTimeout: parseInt(process.env.VOUCHER_LOCK_TIMEOUT || '300000', 10), // 5 minutes
    },
    event: {
      editLockTimeout: parseInt(process.env.EVENT_EDIT_LOCK_TIMEOUT || '300000', 10), // 5 minutes
      maxConcurrentEdits: parseInt(process.env.EVENT_MAX_CONCURRENT_EDITS || '1', 10),
    },
    pagination: {
      defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '10', 10),
      maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),
    },
  },
};

export default config;