import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository.js";

export class AuthValidationError extends Error { }
export class EmailAlreadyRegisteredError extends Error { }
export class InvalidCredentialsError extends Error { }

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado");
}

function isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const pgError = (error.cause ?? error) as { code?: unknown };

    return pgError.code === "23505";
}

export const authService = {
    async register(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();

        if (
            normalizedEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            throw new AuthValidationError("Email inválido");
        }

        if (password.length < 8) {
            throw new AuthValidationError(
                "La contraseña debe tener al menos 8 caracteres"
            );
        }

        if (Buffer.byteLength(password, "utf8") > 72) {
            throw new AuthValidationError("Contraseña demasiado larga");
        }

        const existingUser = await authRepository.findByEmail(normalizedEmail);

        if (existingUser) {
            throw new EmailAlreadyRegisteredError("El email ya está registrado");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        try {
            return await authRepository.create({
                email: normalizedEmail,
                passwordHash,
            });
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new EmailAlreadyRegisteredError("El email ya está registrado");
            }

            throw error;
        }
    },

    async login(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await authRepository.findByEmail(normalizedEmail);

        if (!user) {
            throw new InvalidCredentialsError("Credenciales inválidas");
        }

        const validPassword = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!validPassword) {
            throw new InvalidCredentialsError("Credenciales inválidas");
        }

        const token = jwt.sign(
            { sub: String(user.id) },
            JWT_SECRET,
            { expiresIn: "1h", algorithm: "HS256" }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        };
    },
};