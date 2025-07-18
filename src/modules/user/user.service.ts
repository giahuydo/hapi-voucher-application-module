import { User, UserDocument } from './user.model';
import { CreateUserInput, UpdateUserInput } from './dto/user.input';
import { UserDTO } from './dto/user.dto';
import { transformUser } from './user.transformer';
import bcrypt from 'bcryptjs';

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput): Promise<UserDTO> {
  const exists = await User.findOne({ email: data.email }).lean();
  if (exists) {
    throw new Error('Email already exists');
  }

  const user = new User(data);
  const saved = await user.save();
  return transformUser(saved);
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<UserDTO[]> {
  const users = await User.find().lean();
  return users.map(transformUser);
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserDTO | null> {
  const user = await User.findById(id).lean();
  return user ? transformUser(user) : null;
}

/**
 * Update user by ID
 * Does NOT update password — use changePassword() instead
 */
export async function updateUser(id: string, data: UpdateUserInput): Promise<UserDTO | null> {
  const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
  return updatedUser ? transformUser(updatedUser) : null;
}

/**
 * Delete user by ID
 */
export async function deleteUser(id: string): Promise<UserDTO | null> {
  const deletedUser = await User.findByIdAndDelete(id);
  return deletedUser ? transformUser(deletedUser) : null;
}

/**
 * Change password by verifying old password
 */
export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await User.findById(id);
  if (!user) return false;

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return false;

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return true;
}
