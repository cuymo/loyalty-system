import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { admins, adminNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { triggerWebhook } from "@/lib/webhook";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    trustHost: true,
    providers: [
        Credentials({
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const [admin] = await db
                    .select()
                    .from(admins)
                    .where(eq(admins.email, email))
                    .limit(1);

                if (!admin) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(password, admin.password);

                if (!isPasswordValid) {
                    return null;
                }

                // Registrar inicio de sesion en el historial y disparar webhook
                try {
                    await db.insert(adminNotifications).values({
                        type: "admin_login",
                        message: `Inicio de sesión detectado: ${admin.name} (${admin.email})`,
                        isRead: false,
                    });

                    await triggerWebhook("admin.inicio_sesion", {
                        adminId: admin.id,
                        email: admin.email,
                        name: admin.name,
                        timestamp: new Date().toISOString(),
                    });
                } catch (error) {
                    console.error("Error al registrar inicio de sesión del admin:", error);
                }

                return {
                    id: String(admin.id),
                    email: admin.email,
                    name: admin.name,
                };
            },
        }),
    ],
});

