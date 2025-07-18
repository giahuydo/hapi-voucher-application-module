import { UserDocument } from './user.model';
import { UserDTO } from './dto/user.dto';
import { Types } from 'mongoose';

type ObjectIdLike = string | Types.ObjectId;

type UserInput = Partial<{
  _id: ObjectIdLike;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

/**
 * Transforms a Mongoose UserDocument or lean UserInput to safe DTO.
 */
export function transformUser(user: UserDocument | UserInput): UserDTO {
  return {
    id: user._id?.toString?.() ?? '',
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role === 'admin' ? 'admin' : 'user',    
    isActive: user.isActive ?? false,
    createdAt: user.createdAt ?? new Date(0),
    updatedAt: user.updatedAt ?? new Date(0),
  };
}

/**
 * Transforms list of UserDocument or lean objects into DTOs.
 */
export function transformUserList(users: (UserDocument | UserInput)[]): UserDTO[] {
  return users.map(transformUser);
}