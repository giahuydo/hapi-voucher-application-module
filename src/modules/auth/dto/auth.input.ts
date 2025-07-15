import Joi from 'joi';

/**
 * Input for user registration
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const registerSchema = Joi.object<RegisterInput>({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Input for user login
 */
export interface LoginInput {
  email: string;
  password: string;
}

export const loginSchema = Joi.object<LoginInput>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
