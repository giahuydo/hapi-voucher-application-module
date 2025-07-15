/**
 * Auth response DTO
 */
export interface AuthResponseDTO {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
