// backend/src/config/env.ts
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// env.ts nằm ở: backend/src/config/env.ts
// => BACKEND_DIR = backend/
const BACKEND_DIR = path.resolve(__dirname, "..", "..");

// data json nằm ở: backend/electron/data
const DATA_DIR = path.join(BACKEND_DIR, "electron", "data");

export const env = {
  port: Number(process.env.PORT ?? 5179),

  // canonical
  dataDir: process.env.DATA_DIR ? String(process.env.DATA_DIR) : DATA_DIR,

  // aliases để code cũ không gãy
  backendDataDir: process.env.DATA_DIR ? String(process.env.DATA_DIR) : DATA_DIR,
  rootDataDir: process.env.DATA_DIR ? String(process.env.DATA_DIR) : DATA_DIR,
};

export default env;
