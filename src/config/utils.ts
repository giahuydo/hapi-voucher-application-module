import config from './index';

/**
 * Simple configuration utilities
 */
export class ConfigUtils {
  /**
   * Check if running in development mode
   */
  static isDevelopment(): boolean {
    return config.app.env === 'development';
  }

  /**
   * Check if running in production mode
   */
  static isProduction(): boolean {
    return config.app.env === 'production';
  }

  /**
   * Check if running in test mode
   */
  static isTest(): boolean {
    return config.app.env === 'test';
  }

  /**
   * Get JWT configuration for token generation
   */
  static getJWTConfig() {
    return {
      secret: config.auth.jwt.secret,
      expiresIn: config.auth.jwt.expiresIn,
    };
  }

  /**
   * Get MongoDB connection string
   */
  static getMongoConnectionString(): string {
    return `${config.database.mongo.uri}/${config.database.mongo.dbName}`;
  }

  /**
   * Get Redis connection configuration
   */
  static getRedisConfig() {
    return {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    };
  }

  /**
   * Get Bull queue configuration
   */
  static getBullConfig() {
    return {
      redis: config.queue.bull.redis,
      defaultJobOptions: config.queue.bull.defaultJobOptions,
    };
  }

  /**
   * Get voucher configuration
   */
  static getVoucherConfig() {
    return config.business.voucher;
  }

  /**
   * Get event configuration
   */
  static getEventConfig() {
    return config.business.event;
  }

  /**
   * Get pagination configuration
   */
  static getPaginationConfig() {
    return config.business.pagination;
  }
}

export default ConfigUtils;