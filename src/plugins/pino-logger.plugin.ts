import { Plugin, Server } from '@hapi/hapi';
import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

const pinoLoggerPlugin: Plugin<any> = {
  name: 'pino-logger',
  version: '1.0.0',
  register: async (server: Server) => {
    // Add logger to server
    (server.app as any).logger = logger;

    // HTTP request logging middleware
    const pinoMiddleware = pinoHttp({
      logger: logger,
      customLogLevel: function (req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        } else if (res.statusCode >= 500 || err) {
          return 'error';
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          return 'silent';
        }
        return 'info';
      },
      customSuccessMessage: function (req, res) {
        if (res.statusCode === 404) {
          return 'resource not found';
        }
        return `${req.method} ${req.url}`;
      },
      customErrorMessage: function (req, res, err) {
        return `${req.method} ${req.url} - ${err.message}`;
      },
      customAttributeKeys: {
        req: 'request',
        res: 'response',
        err: 'error',
        responseTime: 'responseTime'
      },
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'authorization': req.headers['authorization'] ? '[REDACTED]' : undefined
          },
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort
        }),
        res: (res) => ({
          statusCode: res.statusCode,
          headers: {
            'content-type': res.headers['content-type'],
            'content-length': res.headers['content-length']
          }
        })
      }
    });

    // Register middleware
    server.ext('onRequest', (request, h) => {
      pinoMiddleware(request.raw.req, request.raw.res, () => {});
      return h.continue;
    });

    // Log response
    server.ext('onPreResponse', (request, h) => {
      const responseTime = Date.now() - request.info.received;
      const userAgent = request.headers['user-agent'] || '';
      const isRenderHealthCheck = userAgent.startsWith('Render/');
      
      if (request.response && 'statusCode' in request.response) {
        if (isRenderHealthCheck) {
          // Short log for Render health checks
          logger.info(`${request.method} ${request.url.pathname} - ${request.response.statusCode} (${responseTime}ms)`);
        } else {
          // Full log for regular requests
          logger.info({
            request: {
              method: request.method,
              url: request.url.href,
              headers: request.headers,
              query: request.query,
              params: request.params,
              payload: request.payload
            },
            response: {
              statusCode: request.response.statusCode,
              headers: request.response.headers
            },
            responseTime: responseTime,
            user: request.auth?.credentials ? {
              id: (request.auth.credentials as any).userId,
              email: (request.auth.credentials as any).email
            } : null
          }, `${request.method} ${request.url.pathname} - ${request.response.statusCode}`);
        }
      }
      
      return h.continue;
    });

    // Log errors
    server.events.on('request', (request, event, tags) => {
      if (tags.error) {
        logger.error({
          request: {
            method: request.method,
            url: request.url.href,
            headers: request.headers
          },
          error: event.error
        }, `Request error: ${(event.error as any).message}`);
      }
    });

    console.log('✅ Pino logger plugin registered');
  }
};

export default pinoLoggerPlugin;
