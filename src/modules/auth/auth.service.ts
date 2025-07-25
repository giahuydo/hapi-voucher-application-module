import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../user/user.model';
import { RegisterInput, LoginInput } from './dto/auth.input';
import { AuthResponseDTO } from './dto/auth.dto';
import { transformAuthUser } from './auth.transformer';
import { ValidationError, NotFoundError } from '../../../utils/errorHandler';
import dotenv from 'dotenv';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Register new user
 */
export const register = async (input: RegisterInput): Promise<AuthResponseDTO> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new ValidationError('Email already exists');
  }

  const newUser = new User({
    name: input.name,
    email: input.email,
    password: input.password ? await bcrypt.hash(input.password, 10) : undefined,
  });

  const savedUser = await newUser.save();

  const token = jwt.sign({ sub: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: transformAuthUser(savedUser),
  };
};

/**
 * Login user
 */
export const login = async (input: LoginInput): Promise<AuthResponseDTO> => {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) {
    throw new ValidationError('Invalid email or password');
  }

  const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: transformAuthUser(user),
  };
};
