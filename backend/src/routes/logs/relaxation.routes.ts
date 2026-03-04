import { Router } from "express";
import * as ctrl from "../../controllers/logs/relaxation.controller.js";

const router = Router();

router.get("/", ctrl.getAll);
router.post("/custom", ctrl.createCustom);

export default router;
