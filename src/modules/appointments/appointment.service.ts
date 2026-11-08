import { appointmentRepository } from "./appointment.repository.js";
import { appointments } from "../../db/schema.js";

type NewAppointment = typeof appointments.$inferInsert;

export class ValidationError extends Error {}

export const appointmentService = {
    async findAll() {
        return appointmentRepository.findAll();
    },

    async findById(id: number) {
        return appointmentRepository.findById(id);
    },

    async create(data: NewAppointment) {
        if (!data.patientName.trim()) {
            throw new ValidationError("El nombre del paciente es obligatorio");
        }

        if (
            !(data.scheduledAt instanceof Date) ||
            Number.isNaN(data.scheduledAt.getTime())
        ) {
            throw new ValidationError("La fecha es inválida");
        }

        if (data.scheduledAt.getTime() <= Date.now()) {
            throw new ValidationError("El turno debe ser en una fecha futura");
        }

        return appointmentRepository.create(data);
    },

    async update(id: number, data: Partial<NewAppointment>) {
        if (data.patientName !== undefined && !data.patientName.trim()) {
            throw new ValidationError("El nombre del paciente no puede estar vacío");
        }

        if (data.scheduledAt !== undefined) {
            if (
                !(data.scheduledAt instanceof Date) ||
                Number.isNaN(data.scheduledAt.getTime())
            ) {
                throw new ValidationError("La fecha es inválida");
            }

            if (data.scheduledAt.getTime() <= Date.now()) {
                throw new ValidationError("El turno debe ser en una fecha futura");
            }
        }

        return appointmentRepository.update(id, data);
    },

    async remove(id: number) {
        return appointmentRepository.remove(id);
    }
};