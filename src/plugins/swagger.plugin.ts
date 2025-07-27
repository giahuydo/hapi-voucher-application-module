import { Plugin } from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';

const SwaggerPlugin: Plugin<null> = {
  name: 'app-swagger',
  version: '1.0.0',
  register: async function (server) {
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: {
          info: {
            title: 'Voucher Management API',
            version: '1.0.0',
            description: 'RESTful API for event-voucher system with JWT auth & Agenda job'
          },
          documentationPath: '/docs',
          tags: [
            { name: 'api', description: 'All API routes' },
            { name: 'users', description: 'Users management'},
            { name: 'auth', description: 'Authentication (public)' },
            { name: 'vouchers', description: 'Voucher operations' },
            { name: 'events', description: 'Event management' }
          ]
        }
      }
    ]);
    console.log('✅ Swagger plugin registered');
  }
};

export default SwaggerPlugin;