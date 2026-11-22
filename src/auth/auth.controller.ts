import type { Request, Response } from "express";

import {
    authService,
    AuthValidationError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
} from "./auth.service.js";

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const body: unknown = req.body;

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                res.status(400).json({ message: "JSON inválido" });
                return;
            }

            const { email, password } = body as Record<string, unknown>;

            if (typeof email !== "string" || typeof password !== "string") {
                res.status(400).json({
                    message: "Email y contraseña son obligatorios",
                });
                return;
            }

            const user = await authService.register(email, password);

            res.status(201).json(user);
        } catch (error) {
            if (error instanceof AuthValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }

            if (error instanceof EmailAlreadyRegisteredError) {
                res.status(409).json({ message: error.message });
                return;
            }

            console.error(error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const body: unknown = req.body;

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                res.status(400).json({ message: "JSON inválido" });
                return;
            }

            const { email, password } = body as Record<string, unknown>;

            if (typeof email !== "string" || typeof password !== "string") {
                res.status(400).json({
                    message: "Email y contraseña son obligatorios",
                });
                return;
            }

            const result = await authService.login(email, password);

            res.status(200).json(result);
        } catch (error) {
            if (error instanceof InvalidCredentialsError) {
                res.status(401).json({ message: error.message });
                return;
            }

            console.error(error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
};