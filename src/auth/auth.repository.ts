import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

type NewUser = typeof users.$inferInsert;

export const authRepository = {
    async findByEmail(email: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return user ?? null;
    },

    async create(data: NewUser) {
        const [user] = await db
            .insert(users)
            .values(data)
            .returning({
                id: users.id,
                email: users.email,
            });

        return user;
    },
};