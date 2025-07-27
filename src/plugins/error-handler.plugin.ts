import Boom from '@hapi/boom';
import { Plugin } from '@hapi/hapi';
import { handleError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

const ErrorHandlerPlugin: Plugin<undefined> = {
  name: 'error-handler',
  version: '1.0.0',

  register: (server) => {
    server.ext('onPreResponse', (request, h) => {
      const res = request.response;

      if (Boom.isBoom(res) || res instanceof Error) {
        const errorPayload = handleError(res);

        logger.error(
          `[${request.method.toUpperCase()}] ${request.path} - ❌ ${errorPayload.statusCode} - ${errorPayload.message}`
        );

        return h
          .response({
            success: false,
            error: errorPayload.error,
            message: errorPayload.message,
          })
          .code(errorPayload.statusCode);
      }

      return h.continue;
    });
    console.log('🔧 Error handler plugin registered');
  },
};
export default ErrorHandlerPlugin;