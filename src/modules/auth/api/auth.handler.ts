// src/modules/auth/api/auth.handler.ts
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as AuthService from '../auth.service';
import { LoginInput, RegisterInput } from '../dto/auth.input';

export const registerHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const input = req.payload as RegisterInput;
    const result = await AuthService.register(input);
    return h.response({ success: true, message: 'Registered', data: result }).code(201);
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(400);
  }
};

export const loginHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const input = req.payload as LoginInput;
    const token = await AuthService.login(input);
    return h.response({ success: true, token }).code(200);
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(401);
  }
};
