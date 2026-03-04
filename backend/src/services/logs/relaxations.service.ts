import * as repo from "../../repos/relaxations.repo.js";

export function listRelaxations() {
  return repo.listRelaxations();
}

export function addCustomRelaxation(payload: any) {
  const title = String(payload?.title || "").trim();
  const category = String(payload?.category || "").trim();

  if (!title) throw new Error("title is required");
  if (!category) throw new Error("category is required");

  const item = {
    id: payload?.id || `relax_custom_${Date.now()}`,
    title,
    category,
    suggestedMinutes:
      payload?.suggestedMinutes !== undefined ? Number(payload.suggestedMinutes) : undefined,
    caloriesPerMinute:
      payload?.caloriesPerMinute !== undefined ? Number(payload.caloriesPerMinute) : undefined,
    imageUrl: payload?.imageUrl ? String(payload.imageUrl) : undefined,
  };

  return repo.addCustomRelaxation(item);
}
