import type { UserPublic } from "../repos/auth.repo.js";
import {
  ensureSeedDemoUsers,
  registerUser,
  verifyLogin,
  createSession,
  getSession,
  deleteSession,
  getUserById,
} from "../repos/auth.repo.js";

export async function ensureDemoUsers() {
  await ensureSeedDemoUsers();
}

export async function register(input: { email: string; password: string; name: string; age?: number }) {
  return registerUser(input);
}

export async function login(input: { email: string; password: string; remember?: boolean }) {
  const user = await verifyLogin(input.email, input.password);
  if (!user) return null;
  const session = await createSession(user.id, !!input.remember);
  return { user, session };
}

export async function authFromToken(token: string): Promise<UserPublic | null> {
  const s = await getSession(token);
  if (!s) return null;
  return getUserById(s.userId);
}

export async function logout(token: string) {
  await deleteSession(token);
}
