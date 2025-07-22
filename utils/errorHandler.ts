import { logger } from './logger';


export function createError(
  name: string,
  message: string,
  statusCode = 500
): AppError {
  const err = new AppError(message, statusCode);
  err.name = name;
  return err;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error') {
    super(message, 400);
  }
}


export function handleError(err: any) {
  const stack = err.stack || new Error().stack;

  if (err instanceof AppError) {
    logger.error(`[AppError] ${err.message} (status: ${err.statusCode})\n${stack}`);
    return {
      statusCode: err.statusCode,
      error: err.name,
      message: err.message,
    };
  }

  // Joi validation
  if (err.isJoi) {
    const message = err.details?.map((d: any) => d.message).join(', ') || err.message;
    logger.warn(`[JoiValidationError] ${message}\n${stack}`);
    return {
      statusCode: 400,
      error: 'ValidationError',
      message,
    };
  }

  const errorMap: Record<string, { statusCode: number; error: string; defaultMessage: string; logLevel: 'warn' | 'error' }> = {
    MongoError:            { statusCode: 409, error: 'DuplicateKeyError',    defaultMessage: 'Resource already exists', logLevel: 'warn' },
    CastError:             { statusCode: 400, error: 'CastError',            defaultMessage: 'Invalid resource ID',     logLevel: 'warn' },
    ValidationError:       { statusCode: 400, error: 'ValidationError',      defaultMessage: 'Validation failed',       logLevel: 'warn' },
    UnauthorizedError:     { statusCode: 401, error: 'Unauthorized',         defaultMessage: 'Unauthorized access',     logLevel: 'warn' },
    ForbiddenError:        { statusCode: 403, error: 'Forbidden',            defaultMessage: 'Forbidden access',        logLevel: 'warn' },
    NotFoundError:         { statusCode: 404, error: 'NotFound',             defaultMessage: 'Resource not found',      logLevel: 'warn' },
    ConflictError:         { statusCode: 409, error: 'Conflict',             defaultMessage: 'Resource conflict',       logLevel: 'warn' },
    TimeoutError:          { statusCode: 408, error: 'Timeout',              defaultMessage: 'Request timed out',       logLevel: 'warn' },
    RateLimitError:        { statusCode: 429, error: 'TooManyRequests',      defaultMessage: 'Too many requests',       logLevel: 'warn' },
  };

  const mapped = errorMap[err.name];
  if (mapped) {
    const message = err.message || mapped.defaultMessage;
    logger[mapped.logLevel](`[${err.name}] ${message}\n${stack}`);
    return {
      statusCode: mapped.statusCode,
      error: mapped.error,
      message,
    };
  }

  const unknownMessage = err.message || 'Internal server error';
  logger.error(`[UnknownError] ${unknownMessage}\n${stack}`);
  return {
    statusCode: 500,
    error: 'InternalServerError',
    message: unknownMessage,
  };
}