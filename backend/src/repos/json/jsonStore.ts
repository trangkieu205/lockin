import { promises as fs } from "fs";
import path from "path";

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === "ENOENT") return fallback;
    throw e;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

export async function updateJsonFile<T>(
  filePath: string,
  fallback: T,
  updater: (cur: T) => T
): Promise<T> {
  const cur = await readJsonFile<T>(filePath, fallback);
  const next = updater(cur);
  await writeJsonFile<T>(filePath, next);
  return next;
}
