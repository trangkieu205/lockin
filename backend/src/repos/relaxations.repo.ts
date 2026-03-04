import fs from "fs";
import path from "path";

type Relaxation = {
  id: string;
  title: string;
  category: string;
  suggestedMinutes?: number;
  caloriesPerMinute?: number;
  imageUrl?: string; // base64 hoặc /assets/...
};

type RelaxationsFile = {
  presets: Relaxation[];
  custom: Relaxation[];
};

// ✅ Nếu project em đã có biến dataDir (config/path.ts) thì thay DATA_DIR bằng dataDir cho chuẩn
const DATA_DIR =
  process.env.DATA_DIR ||
  path.resolve(process.cwd(), "../electron/data"); // thường đúng nếu chạy trong /backend

const FILE_PATH = path.join(DATA_DIR, "relaxations.json");

function readFileSafe(): RelaxationsFile {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return { presets: [], custom: [] };
    }
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return {
      presets: Array.isArray(data?.presets) ? data.presets : [],
      custom: Array.isArray(data?.custom) ? data.custom : [],
    };
  } catch {
    return { presets: [], custom: [] };
  }
}

function writeFileSafe(data: RelaxationsFile) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function listRelaxations() {
  return readFileSafe();
}

export function addCustomRelaxation(item: Relaxation) {
  const data = readFileSafe();
  data.custom = [item, ...(data.custom || [])];
  writeFileSafe(data);
  return item;
}
