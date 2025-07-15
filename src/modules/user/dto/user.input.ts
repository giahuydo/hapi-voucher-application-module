import Joi from 'joi';

/**
 * Input data for creating a new user.
 * Used in POST /api/users
 */
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export const createUserSchema = Joi.object<CreateUserInput>({
  name: Joi.string().min(2).required().description('Full name of the user'),
  email: Joi.string().email().required().description('Email address'),
  password: Joi.string().min(6).required().description('Password (min 6 characters)'),
  role: Joi.string().valid('user', 'admin').optional().description('User role (default: user)'),
});

/**
 * Input data for updating user information.
 * Used in PUT /api/users/{id}
 * Note: Password is excluded; use a separate route to change password.
 */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

export const updateUserSchema = Joi.object<UpdateUserInput>({
  name: Joi.string().min(2).optional().description('Full name'),
  email: Joi.string().email().optional().description('Email address'),
  role: Joi.string().valid('user', 'admin').optional().description('User role'),
  isActive: Joi.boolean().optional().description('Active status of the user'),
});

/**
 * Input data for changing a user’s password.
 * Used in PATCH /api/users/{id}/password
 */
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const updatePasswordSchema = Joi.object<UpdatePasswordInput>({
  currentPassword: Joi.string().required().description('Current password'),
  newPassword: Joi.string().min(6).required().description('New password (min 6 characters)'),
});
