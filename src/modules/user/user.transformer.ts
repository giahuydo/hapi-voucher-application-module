import { UserDocument } from './user.model';
import { UserDTO } from './dto/user.dto';

/**
 * Transforms a Mongoose UserDocument into a safe UserDTO for client response.
 * Strips out sensitive/internal fields like password, __v, etc.
 */
export function transformUser(user: UserDocument): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
