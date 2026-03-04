import type { Exercise } from "../repos/exercises.repo.js";
import { listExercises } from "../repos/exercises.repo.js";

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export async function searchExercises(params?: {
  query?: string;
  category?: string;
}): Promise<Exercise[]> {
  const all = await listExercises();

  const q = norm(params?.query);
  const cat = norm(params?.category);

  let out = all;
  if (cat) out = out.filter((x) => norm(x.category) === cat);
  if (q) out = out.filter((x) => norm(x.title).includes(q));
  return out;
}
