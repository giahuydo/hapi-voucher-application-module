import { Request, ResponseToolkit } from '@hapi/hapi';
import * as UserService from '../user.service';
import { CreateUserInput, UpdateUserInput } from '../dto/user.input';
import logger from '../../../../utils/logger';

export const createUserHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const input = req.payload as CreateUserInput;
    const user = await UserService.createUser(input);
    return h.response(user).code(201);
  } catch (err: any) {
    return h.response({ message: err.message }).code(400);
  }
};

export const getUserByIdHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const id = req.params.id;
    const user = await UserService.getUserById(id);
    if (!user) return h.response({ message: 'User not found' }).code(404);
    return h.response(user);
  } catch (err: any) {
    return h.response({ message: err.message }).code(400);
  }
};

export const getAllUsersHandler = async (_req: Request, h: ResponseToolkit) => {
  try {
   
    // logger.info('🧪 typeof UserService:', typeof UserService); // object
    // logger.info('🧪 Keys in UserService:', Object.keys(UserService)); // [ 'getAllUsers', ... ]
    // logger.info('🧪 getAllUsers typeof:', typeof UserService.getAllUsers); // function

    const users = await UserService.getAllUsers();
    return h.response(users);
  } catch (err: any) {
    return h.response({ message: err.message }).code(500);
  }
};

export const updateUserHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const id = req.params.id;
    const data = req.payload as UpdateUserInput; // Cast to UpdateUserInput
    const updatedUser = await UserService.updateUser(id, data);
    if (!updatedUser) return h.response({ message: 'User not found' }).code(404);
    return h.response(updatedUser);
  } catch (err: any) {
    return h.response({ message: err.message }).code(400);
  }
};

export const deleteUserHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const id = req.params.id;
    const deleted = await UserService.deleteUser(id);
    if (!deleted) return h.response({ message: 'User not found' }).code(404);
    return h.response({ message: 'User deleted successfully' });
  } catch (err: any) {
    return h.response({ message: err.message }).code(400);
  }
};

export const getMeHandler = async (req: Request, h: ResponseToolkit) => {
  const { userId, email, name, role } = req.auth.credentials;

  return {
    id: userId,
    name,
    email,
    role,
  };
};
