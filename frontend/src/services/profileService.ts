// frontend/src/services/profileService.ts
import { getJson, putJson } from "./http";

/**
 * Nếu em đã có type Profile ở chỗ khác thì thay lại.
 * Giữ any để chạy được ngay, khỏi kẹt type.
 */
export type ProfileDto = any;

export async function getProfile(): Promise<ProfileDto> {
  // backend mount: /profile/me
  const data = await getJson("/profile/me");
  // tuỳ backend trả { profile } hay trả thẳng object
  return (data as any)?.profile ?? data;
}

export async function updateProfile(payload: Partial<ProfileDto>): Promise<ProfileDto> {
  const data = await putJson("/profile/me", payload);
  return (data as any)?.profile ?? data;
}
