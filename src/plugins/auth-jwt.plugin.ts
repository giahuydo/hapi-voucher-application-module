import { Request, ResponseToolkit, Server } from '@hapi/hapi';
import HapiAuthJwt2 from 'hapi-auth-jwt2';
import { User } from '../modules/user/user.model'; // import model thật
import logger from '../../utils/logger';

const validate = async (
  decoded: any,
  request: Request,
  h: ResponseToolkit
) => {

  if (!decoded.sub) {
    logger.warn('❌ Token is missing sub field');
    return { isValid: false };
  }

  try {
    const user = await User.findById(decoded.sub).lean();

    if (!user) {
      logger.warn(`❌ User not found for sub: ${decoded.sub}`);
      return { isValid: false };
    }

    return {
      isValid: true,
      credentials: {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (err) {
    logger.error('🔥 Error in validate():', err);
    return { isValid: false };
  }
};
/**
 * Hapi plugin to register JWT authentication strategy
 */
export default {
  name: 'auth-jwt',        // Plugin name (arbitrary but must be unique)
  version: '1.0.0',        // Plugin version

  register: async function (server: Server) {
    const JWT_SECRET = process.env.JWT_SECRET;
    await server.register(HapiAuthJwt2);

    // Define a new authentication strategy named "jwt"
    server.auth.strategy('jwt', 'jwt', {
      key: JWT_SECRET,              // Secret key used to verify the JWT signature
      validate,                     // Custom function to validate decoded JWT payload
      verifyOptions: {
        algorithms: ['HS256'],      // Ensure only HS256 algorithm is accepted
      },
    });

    // Set the default auth strategy to "jwt" for all routes (unless explicitly disabled via auth: false)
    server.auth.default('jwt');
  },
};