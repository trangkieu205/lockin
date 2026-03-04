import { Router } from "express";
import * as ctrl from "../controllers/exercises.controller.js";

const router = Router();

router.get("/", ctrl.list);
router.get("/favorites", ctrl.favorites);

router.post("/custom", ctrl.createCustom);
router.delete("/custom/:id", ctrl.removeCustom);

router.patch("/:id/favorite", ctrl.favorite);

export default router;
