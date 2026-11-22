import { Router } from "express";
import { appointmentController } from "./appointment.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", appointmentController.findAll);
router.get("/:id", appointmentController.findById);

router.post("/", requireAuth, appointmentController.create);
router.put("/:id", requireAuth, appointmentController.update);
router.delete("/:id", requireAuth, appointmentController.remove);

export default router;