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
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      error: err.name,
      message: err.message,
    };
  }
 
  if (err.isJoi) {
    return {
      statusCode: 400,
      error: 'ValidationError',
      message: err.details?.map((d: any) => d.message).join(', ') || err.message,
    };
  }
  // Lỗi không xác định
  return {
    statusCode: 500,
    error: 'InternalServerError',
    message: err.message || 'Internal server error',
  };
} 