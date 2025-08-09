import { Request, ResponseToolkit, Server } from "@hapi/hapi";
import HapiAuthJwt2 from "hapi-auth-jwt2";
import { User } from "../modules/user/user.model";
import { logger } from "../../utils/logger";

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const validate = async (
  decoded: JwtPayload,
  request: Request,
  h: ResponseToolkit
) => {
  if (!decoded.sub) {
    logger.warn("❌ Token is missing sub field");
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
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  } catch (err) {
    logger.error("🔥 Error in validate():", err);
    return { isValid: false };
  }
};

export default {
  name: "auth-jwt",
  version: "1.0.0",
  register: async function (server: Server) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error("❌ Missing JWT_SECRET in environment variables");
    }

    await server.register(HapiAuthJwt2);

    server.auth.strategy("jwt", "jwt", {
      key: JWT_SECRET,
      validate,
      verifyOptions: {
        algorithms: ["HS256"],
      },
    });

    // Don't set default auth - let routes specify their own auth requirements
    console.log("🔧 JWT Auth strategy registered");
  },
};
