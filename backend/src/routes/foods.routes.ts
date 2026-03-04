import { Router } from "express";
import * as ctrl from "../controllers/foods.controller.js";

const router = Router();

router.get("/", ctrl.list);

router.get("/favorites", ctrl.favorites);
router.post("/favorites", ctrl.addFav);
router.delete("/favorites/:foodId", ctrl.delFav);

router.post("/custom", ctrl.createCustom);

export default router;
