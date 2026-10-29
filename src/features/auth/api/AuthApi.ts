import type { ApiClient } from "../../../shared/api/ApiClient";

export type AuthUser = { username: string; email: string };
export type AuthResponse = { msg: string; user: AuthUser };
export type PasswordLoginRequest = {
  username?: string;
  email: string;
  password: string;
};
export type GoogleLoginRequest = {
  email: string;
  name: string;
  googleId: string;
};

export class AuthApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  login(data: PasswordLoginRequest): Promise<AuthResponse> {
    return this.client.post<AuthResponse, PasswordLoginRequest>(
      "/api/auth/login",
      data,
    );
  }

  googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    return this.client.post<AuthResponse, GoogleLoginRequest>(
      "/api/auth/google",
      data,
    );
  }
}
