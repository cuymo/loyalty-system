import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAuthRoute = req.nextUrl.pathname.startsWith("/admin/login");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    if (isAuthRoute) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/admin", req.nextUrl));
        }
        return NextResponse.next();
    }

    if (isAdminRoute && !isLoggedIn) {
        let from = req.nextUrl.pathname;
        if (req.nextUrl.search) {
            from += req.nextUrl.search;
        }
        return NextResponse.redirect(
            new URL(`/admin/login?callbackUrl=${encodeURIComponent(from)}`, req.nextUrl)
        );
    }

    return NextResponse.next();
});

// Define paths where the middleware should run
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
