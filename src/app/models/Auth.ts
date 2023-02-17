import { AppRoles } from '../core/app.roles';
export interface AuthResponse {
  tokens: TokensResponse;
  id: number;
  role: AppRoles;
  email: string;
  fullname: string;
  updatedAt: string;
  createdAt: string;
}

export interface TokensResponse {
  accessToken: string;
  expiresIn: number;
}

