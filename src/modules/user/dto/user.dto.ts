/**
 * Data Transfer Object (DTO) representing a user returned to clients.
 */
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
