import { Router } from "express";
import * as ctrl from "../controllers/stats.controller.js";

const router = Router();
router.get("/today", ctrl.today);
export default router;
