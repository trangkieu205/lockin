import type { UserPublic } from "../repos/auth.repo.js";
import type { UserProfile } from "../repos/profile.repo.js";
import { getProfile, upsertProfile } from "../repos/profile.repo.js";

export async function getOrCreateProfile(user: UserPublic): Promise<UserProfile> {
  const cur = await getProfile(user.id);
  if (cur) return cur;

  const seed: UserProfile = {
    userId: user.id,
    name: user.name,
    age: user.age,
    sex: (user as any).sex,
    heightCm: (user as any).heightCm,
    weightKg: (user as any).weightKg,
    measurements: (user as any).measurements,
    goal: (user as any).goal,
    avatarDataUrl: (user as any).avatarDataUrl,
  };
  return upsertProfile(seed);
}

export async function updateProfile(user: UserPublic, patch: Partial<UserProfile>): Promise<UserProfile> {
  const cur = await getOrCreateProfile(user);
  const next: UserProfile = {
    ...cur,
    ...patch,
    userId: user.id,
    name: (patch.name ?? cur.name) || cur.name,
  };
  return upsertProfile(next);
}
