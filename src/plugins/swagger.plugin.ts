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
            description: `RESTful API for event-voucher system with JWT auth & Agenda job

## 🔐 Authentication Instructions:
1. **Login/Register**: Use the auth endpoints to get a JWT token
2. **Copy Token**: Copy the token value from the response (without "Bearer" prefix)
3. **Authorize**: Click the "Authorize" button (🔒) and paste the token
4. **Use API**: All protected endpoints will now work with your token

## 📝 Example:
- Login response: \`{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}\`
- Copy: \`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\`
- Paste in Authorize modal (the "Bearer" prefix will be added automatically)`
          },
          documentationPath: '/docs',
          securityDefinitions: {
            jwt: {
              type: 'apiKey',
              name: 'Authorization',
              in: 'header',
              description: 'JWT token in format: Bearer <token> - Copy token from login/register response and paste here (without Bearer prefix)'
            }
          },
          security: [{ jwt: [] }], // Default security for all routes
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