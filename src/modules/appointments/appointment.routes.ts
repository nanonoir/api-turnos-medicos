import { Router } from "express";
import { appointmentController } from "./appointment.controller.js";

const router = Router();

router.get("/", appointmentController.findAll);
router.get("/:id", appointmentController.findById);
router.post("/", appointmentController.create);
router.put("/:id", appointmentController.update);
router.delete("/:id", appointmentController.remove);

export default router;