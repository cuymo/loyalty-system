"use server";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/require-admin";
import bcrypt from "bcryptjs";

export async function updateAdminProfile(
    adminId: number,
    data: { name: string; firstName?: string; lastName?: string; email: string; password?: string }
) {
    await requireAdminSession();
    const updateData: any = {
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
    };

    if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.id, adminId));

    revalidatePath("/admin");
    revalidatePath("/admin/profile");
}

export async function getAdminProfile(id: number) {
    await requireAdminSession();
    const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, id))
        .limit(1);
    return admin || null;
}

