import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { readJsonFile, updateJsonFile } from "./json/jsonStore.js";

export type UserRecord = {
  id: number;
  email: string;
  name: string;
  age?: number;
  createdAt: string;
  salt: string;
  passwordHash: string;
  role?: "admin" | "user";
};

export type UserPublic = Omit<UserRecord, "salt" | "passwordHash">;

export type SessionRecord = {
  token: string;
  userId: number;
  createdAt: string;
  expiresAt: string;
};

const USERS_FILE = path.join(env.dataDir, "users.json");
const SESSIONS_FILE = path.join(env.dataDir, "sessions.json");

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
}
function newToken() {
  return crypto.randomUUID() + crypto.randomBytes(16).toString("hex");
}

/**
 * Seed 2 accounts when DB empty:
 * - admin: admin@lockin.local / admin123
 * - demo : demo@lockin.local  / demo123
 */
export async function ensureSeedDemoUsers() {
  await updateJsonFile<UserRecord[]>(USERS_FILE, [], (cur) => {
    if (cur.length > 0) return cur;

    const now = new Date().toISOString();

    const mk = (id: number, email: string, name: string, pass: string, role: "admin" | "user"): UserRecord => {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(pass, salt);
      return { id, email, name, age: 20, createdAt: now, salt, passwordHash, role };
    };

    return [
      mk(1, "admin@lockin.local", "Admin", "admin123", "admin"),
      mk(2, "demo@lockin.local", "Demo User", "demo123", "user"),
    ];
  });
}

export async function registerUser(input: { email: string; password: string; name: string; age?: number }) {
  const email = String(input.email || "").trim().toLowerCase();
  const name = String(input.name || "").trim();

  if (!email || !email.includes("@")) throw new Error("Email invalid");
  if (!input.password || input.password.length < 6) throw new Error("Password must be at least 6 chars");
  if (!name) throw new Error("Name is required");

  let createdUser: UserPublic | null = null;

  await updateJsonFile<UserRecord[]>(USERS_FILE, [], (cur) => {
    if (cur.some((u) => u.email === email)) throw new Error("Email already exists");

    const id = cur.reduce((m, u) => Math.max(m, u.id), 0) + 1;
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(input.password, salt);
    const now = new Date().toISOString();

    const rec: UserRecord = {
      id,
      email,
      name,
      age: input.age,
      createdAt: now,
      salt,
      passwordHash,
      role: "user",
    };

    createdUser = { id, email, name, age: input.age, createdAt: now, role: "user" };
    return [rec, ...cur];
  });

  return createdUser!;
}

export async function verifyLogin(email: string, password: string): Promise<UserPublic | null> {
  const e = String(email).trim().toLowerCase();
  const users = await readJsonFile<UserRecord[]>(USERS_FILE, []);
  const u = users.find((x) => x.email === e);
  if (!u) return null;

  const hash = hashPassword(password, u.salt);
  if (hash !== u.passwordHash) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, salt, ...pub } = u;
  return pub;
}

export async function createSession(userId: number, remember: boolean) {
  const now = new Date();
  const expires = new Date(now.getTime() + (remember ? 7 : 1) * 24 * 60 * 60 * 1000);
  const token = newToken();

  const rec: SessionRecord = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  await updateJsonFile<SessionRecord[]>(SESSIONS_FILE, [], (cur) => [rec, ...cur]);
  return rec;
}

export async function getSession(token: string): Promise<SessionRecord | null> {
  const sessions = await readJsonFile<SessionRecord[]>(SESSIONS_FILE, []);
  const s = sessions.find((x) => x.token === token);
  if (!s) return null;
  if (new Date(s.expiresAt).getTime() <= Date.now()) return null;
  return s;
}

export async function deleteSession(token: string) {
  await updateJsonFile<SessionRecord[]>(SESSIONS_FILE, [], (cur) => cur.filter((x) => x.token !== token));
}

export async function getUserById(id: number): Promise<UserPublic | null> {
  const users = await readJsonFile<UserRecord[]>(USERS_FILE, []);
  const u = users.find((x) => x.id === id);
  if (!u) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, salt, ...pub } = u;
  return pub;
}
