import type { Request, Response } from "express";
import { appointmentService, ValidationError } from "./appointment.service.js";

export const appointmentController = {
    async findAll(_req: Request, res: Response) {
        try {
            const appointments = await appointmentService.findAll();

            res.status(200).json(appointments);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Error interno del servidor",
            });
        }
    },

    async findById(req: Request<{ id: string }>, res: Response) {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id <= 0) {
                res.status(400).json({ message: "ID inválido" });
                return;
            }

            const appointment = await appointmentService.findById(id);

            if (!appointment) {
                res.status(404).json({ message: "Turno no encontrado" });
                return;
            }

            res.status(200).json(appointment);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Error interno del servidor",
            });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const body: unknown = req.body;

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                res.status(400).json({ message: "JSON inválido" });
                return;
            }

            const { patientName, specialty, scheduledAt, status } =
                body as Record<string, unknown>;

            if (
                typeof patientName !== "string" ||
                typeof specialty !== "string" ||
                typeof scheduledAt !== "string"
            ) {
                res.status(400).json({ message: "Datos del turno inválidos" });
                return;
            }

            if (
                status !== undefined &&
                status !== "pending" &&
                status !== "confirmed" &&
                status !== "cancelled"
            ) {
                res.status(400).json({ message: "Estado inválido" });
                return;
            }

            const appointment = await appointmentService.create({
                patientName,
                specialty,
                scheduledAt: new Date(scheduledAt),
                ...(status !== undefined && { status }),
            });

            res.status(201).json(appointment);
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }

            console.error(error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },

    async update(req: Request<{ id: string }>, res: Response) {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id <= 0) {
                res.status(400).json({ message: "ID inválido" });
                return;
            }

            const body: unknown = req.body;

            if (!body || typeof body !== "object" || Array.isArray(body)) {
                res.status(400).json({ message: "JSON inválido" });
                return;
            }

            const { patientName, specialty, scheduledAt, status } =
                body as Record<string, unknown>;

            if (
                (patientName !== undefined && typeof patientName !== "string") ||
                (specialty !== undefined && typeof specialty !== "string") ||
                (scheduledAt !== undefined && typeof scheduledAt !== "string")
            ) {
                res.status(400).json({ message: "Datos inválidos" });
                return;
            }

            if (
                status !== undefined &&
                status !== "pending" &&
                status !== "confirmed" &&
                status !== "cancelled"
            ) {
                res.status(400).json({ message: "Estado inválido" });
                return;
            }

            if (
                patientName === undefined &&
                specialty === undefined &&
                scheduledAt === undefined &&
                status === undefined
            ) {
                res.status(400).json({ message: "No hay campos para actualizar" });
                return;
            }

            const appointment = await appointmentService.update(id, {
                ...(patientName !== undefined && { patientName }),
                ...(specialty !== undefined && { specialty }),
                ...(scheduledAt !== undefined && {
                    scheduledAt: new Date(scheduledAt),
                }),
                ...(status !== undefined && { status }),
            });

            if (!appointment) {
                res.status(404).json({ message: "Turno no encontrado" });
                return;
            }

            res.status(200).json(appointment);
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }

            console.error(error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async remove(req: Request<{ id: string }>, res: Response) {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id <= 0) {
                res.status(400).json({ message: "ID inválido" });
                return;
            }

            const appointment = await appointmentService.remove(id);

            if (!appointment) {
                res.status(404).json({ message: "Turno no encontrado" });
                return;
            }

            res.status(200).json(appointment);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
};