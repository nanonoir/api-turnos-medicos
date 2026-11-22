import express from "express";
import type { Request, Response, NextFunction } from "express";
import appointmentRoutes from "./modules/appointments/appointment.routes.js";
import authRoutes from "./auth/auth.routes.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({ message: "JSON inválido" });
        return;
    }

    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
});

export default app;