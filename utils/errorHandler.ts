import Boom from "@hapi/boom";
import { logger } from "./logger";

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
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error") {
    super(message, 400);
  }
}

/**
 * Handle different types of errors and return a standardized error response.
 * @param err The error object to handle.
 * @returns An object containing statusCode, error name, and message.
 */
export function handleError(err: any) {
  const stack = err?.stack || new Error().stack;

  // 1) Custom application errors
  if (err instanceof AppError) {
    logger.error(
      `[AppError] ${err.message} (status: ${err.statusCode})\n${stack}`
    );
    return {
      statusCode: err.statusCode,
      error: err.name || "AppError",
      message: err.message,
    };
  }

  // 2) Joi validation errors
  if (err?.isJoi) {
    const message =
      err.details?.map((d: any) => d.message).join(", ") ||
      err.message ||
      "Validation failed";
    logger.warn(`[JoiValidationError] ${message}\n${stack}`);
    return {
      statusCode: 400,
      error: "ValidationError",
      message,
    };
  }

  // 3) Mongoose validation errors
  if (Boom.isBoom(err)) {
    const statusCode = err.output?.statusCode ?? 500;
    const boomMsg = err.output?.payload?.message || err.message || "";

    if (statusCode === 401) {
      const message = "Unauthorized access";
      logger.warn(`[Unauthorized] ${boomMsg}\n${stack}`);
      return { statusCode: 401, error: "Unauthorized", message };
    }

    const label =
      statusCode === 403
        ? "Forbidden"
        : statusCode === 404
          ? "NotFound"
          : statusCode === 408
            ? "Timeout"
            : statusCode === 429
              ? "TooManyRequests"
              : "Error";

    logger.warn(`[Boom ${statusCode}] ${boomMsg}\n${stack}`);
    return {
      statusCode,
      error: label,
      message: boomMsg || label,
    };
  }

  // 4 Mongoose validation errors
  if (err?.code === 11000 || /E11000/i.test(String(err?.message))) {
    const message = "Resource already exists";
    logger.warn(`[DuplicateKeyError] ${err?.message}\n${stack}`);
    return { statusCode: 409, error: "DuplicateKeyError", message };
  }

  // 5 JWT errors
  const jwtName = String(err?.name || "");
  if (/JsonWebTokenError|TokenExpiredError|NotBeforeError/i.test(jwtName)) {
    const message = /expired/i.test(String(err?.message))
      ? "Token expired"
      : "Invalid token";
    logger.warn(`[Unauthorized] ${err?.message}\n${stack}`);
    return { statusCode: 401, error: "Unauthorized", message };
  }

  // 6) Unknown
  const unknownMessage = err?.message || "Internal server error";
  logger.error(`[UnknownError] ${unknownMessage}\n${stack}`);
  return {
    statusCode: 500,
    error: "InternalServerError",
    message: unknownMessage,
  };
}
