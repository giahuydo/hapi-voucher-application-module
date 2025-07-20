// src/plugins/error-handler.plugin.ts
import Boom from '@hapi/boom';
import { Plugin } from '@hapi/hapi';
import { handleError } from '../../utils/errorHandler';
import { logger } from '../..//utils/logger';

const ErrorHandlerPlugin: Plugin<undefined> = {
  name: 'error-handler',
  register: (server) => {
    server.ext('onPreResponse', (request, h) => {
      const res = request.response;

      if (Boom.isBoom(res) || res instanceof Error) {
        const err = res;
        const errorPayload = handleError(err);

        logger.error(
          `[${request.method.toUpperCase()}] ${request.path} - status: ${errorPayload.statusCode} - message: ${errorPayload.message}`
        );

        return h
          .response({
            error: errorPayload.error,
            message: errorPayload.message,
          })
          .code(errorPayload.statusCode);
      }

      return h.continue;
    });
  },
};

export default ErrorHandlerPlugin;