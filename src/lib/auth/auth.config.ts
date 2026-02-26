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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Los providers se añaden en index.ts para el login
} satisfies NextAuthConfig;
