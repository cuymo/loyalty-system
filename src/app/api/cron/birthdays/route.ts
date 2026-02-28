/**
ID: api_0004
Tarea programada (Cron) para la asignación automática de puntos de cumpleaños a los clientes registrados.
*/
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, appNotifications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { triggerWebhook } from "@/lib/webhook";
import { getPublicSettings } from "@/actions/client"; // This just queries the 'settings' table, it's safe to use here.

// Secret to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");

    // Allow calling with ?secret= query param or Authorization: Bearer Header
    const requestSecret =
        request.nextUrl.searchParams.get("secret") ||
        (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (CRON_SECRET && requestSecret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Today's Date in MM-DD format
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${month}-${day}`; // Example: "02-23"

        // Fetch settings for birthday bonus
        const pubSettings = await getPublicSettings();
        const birthdayBonus = parseInt(pubSettings.birthday_bonus_points || "200");

        if (birthdayBonus <= 0) {
            return NextResponse.json({ message: "Birthday bonus points is 0 or disabled." });
        }

        // Find clients whose birthDate ends with todayStr. birthDate is stored as YYYY-MM-DD
        const allClients = await db.select().from(clients);

        const birthdayClients = allClients.filter(c => {
            if (!c.birthDate) return false;
            return c.birthDate.endsWith(todayStr);
        });

        const results = [];

        for (const c of birthdayClients) {
            // Update points and lifetimePoints
            await db.update(clients)
                .set({
                    points: sql`${clients.points} + ${birthdayBonus}`,
                    lifetimePoints: sql`${clients.lifetimePoints} + ${birthdayBonus}`
                })
                .where(eq(clients.id, c.id));

            // Setup Notifications
            await db.insert(appNotifications).values({
                clientId: c.id,
                title: "¡Feliz Cumpleaños!",
                body: `¡Esperamos que tengas un gran día! Te hemos regalado ${birthdayBonus} puntos para que los disfrutes.`,
                isRead: false,
                type: "points_earned"
            });

            // Trigger Webhook
            await triggerWebhook("cliente.cumpleanos_celebrado", {
                clientId: c.id,
                username: c.username,
                phone: c.phone,
                pointsAwarded: birthdayBonus,
                wantsMarketing: c.wantsMarketing,
                wantsTransactional: c.wantsTransactional
            });

            results.push({ clientId: c.id, username: c.username });
        }

        return NextResponse.json({
            success: true,
            processed: birthdayClients.length,
            details: results
        });
    } catch (error) {
        console.error("Error executing Birthday Cron:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
