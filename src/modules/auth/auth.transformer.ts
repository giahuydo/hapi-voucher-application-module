import { UserDocument } from '../user/user.model'; // Adjusted the import path

/**
 * Transforms a UserDocument into safe user data for AuthResponseDTO
 */
export function transformAuthUser(user: UserDocument) {
  return {
    id: (user._id as any).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
