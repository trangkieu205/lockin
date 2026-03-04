import * as svc from "../../services/logs/relaxations.service.js";

export async function getAll(_req: any, res: any) {
  try {
    const data = svc.listRelaxations();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to load relaxations" });
  }
}

export async function createCustom(req: any, res: any) {
  try {
    const item = svc.addCustomRelaxation(req.body);
    res.status(201).json(item);
  } catch (e: any) {
    res.status(400).json({ message: e?.message || "Invalid payload" });
  }
}
