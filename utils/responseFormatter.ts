// src/utils/responseFormatter.ts
import { ResponseToolkit } from '@hapi/hapi';
import { handleError } from './errorHandler';

export function formatSuccess(h: ResponseToolkit, data: any, message = 'Success', code = 200) {
  return h.response({
    success: true,
    message,
    data,
  }).code(code);
}

export function formatError(h: ResponseToolkit, err: any) {
  const handled = typeof err === 'object' && err.statusCode
    ? err
    : handleError(err);

  return h.response({
    success: false,
    error: handled.error,
    message: handled.message,
  }).code(handled.statusCode);
}