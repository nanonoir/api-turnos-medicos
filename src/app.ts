import express from "express";
import appointmentRoutes from "./modules/appointments/appointment.routes.js";

const app = express();

app.use(express.json());
app.use("/api/appointments", appointmentRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

export default app;