import type { NextAuthConfig } from "next-auth";

/**
 * auth.config.ts
 * Descripcion: Configuracion base de NextAuth (Edge-compatible)
 * Sin imports de base de datos o bcrypt para evitar errores en Middleware.
 */
export const authConfig = {
    pages: {
        signIn: "/admin/login",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.firstName = (user as any).firstName;
                token.lastName = (user as any).lastName;
            }
            if (trigger === "update" && session) {
                token.firstName = session.firstName;
                token.lastName = session.lastName;
                token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                (session.user as any).firstName = token.firstName as string;
                (session.user as any).lastName = token.lastName as string;
            }
            return session;
        },
    },
    providers: [], // Los providers se añaden en index.ts para el login
} satisfies NextAuthConfig;
