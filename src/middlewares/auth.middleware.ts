import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Token requerido",
        });
        return;
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET no está configurado");
        res.status(500).json({
            message: "Error interno del servidor",
        });
        return;
    }

    try {
        jwt.verify(token, secret, {
            algorithms: ["HS256"],
        });

        next();
    } catch {
        res.status(401).json({
            message: "Token inválido o expirado",
        });
    }
}