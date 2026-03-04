import { Router } from "express";
import * as ctrl from "../controllers/profile.controller.js";

const router = Router();
router.get("/me", ctrl.getMe);
router.put("/me", ctrl.updateMe);

export default router;
