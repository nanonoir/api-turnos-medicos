import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";

type NewAppointment = typeof appointments.$inferInsert;

export const appointmentRepository = {
  async findAll() {
    return await db.select().from(appointments);
  },

  async findById(id: number) {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    return appointment ?? null;
  },

  async create(data: NewAppointment) {
    const [appointment] = await db
        .insert(appointments)
        .values(data)
        .returning()

    return appointment;
  },
  
  async update(id: number, data: Partial<NewAppointment>) {
    const [appointment] = await db
        .update(appointments)
        .set(data)
        .where(eq(appointments.id, id))
        .returning()
    
        return appointment ?? null;
  },

  async remove(id: number) {
    const [appointment] = await db
        .delete(appointments)
        .where(eq(appointments.id, id))
        .returning()
    
    return appointment ?? null;
  }
};