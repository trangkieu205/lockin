// frontend/src/services/authService.ts
import { postJson } from "./http";

export type LoginResult = {
  user: any;
  session: { token: string; userId?: number; expiresAt?: string };
};

export async function login(email: string, password: string, remember: boolean) {
  const data = await postJson("/auth/login", { email, password, remember });
  return data as LoginResult;
}

export async function register(payload: { email: string; password: string; name: string; age?: number }) {
  return postJson("/auth/register", payload);
}
