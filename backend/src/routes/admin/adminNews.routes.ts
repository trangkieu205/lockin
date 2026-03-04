import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import * as ctrl from "../../controllers/admin/adminNews.controller.js";

const router = Router();
router.post("/", requireAdmin, ctrl.create);
router.delete("/:id", requireAdmin, ctrl.remove);

export default router;
