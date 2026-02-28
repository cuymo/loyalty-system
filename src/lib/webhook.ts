/**
ID: lib_011
Servicio de despacho de webhooks externos para la integración con sistemas de terceros.
*/
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
ID: lib_012
Envío asíncrono de eventos mediante POST HTTP, permitiendo la extensibilidad del sistema hacia afuera.
*/
export async function triggerWebhook(eventName: string, data: any) {
    try {
        let [event] = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.eventName, eventName))
            .limit(1);

        if (!event) {
            await db.insert(webhookEvents).values({
                eventName,
                webhookUrl: null,
                isActive: false,
            });
            return;
        }

        if (!event.isActive || !event.webhookUrl) {
            return;
        }

        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data,
        };

        fetch(event.webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }).catch(err => console.error(`Webhook fetch failed for ${event.webhookUrl}:`, err));

    } catch (error) {
        console.error("Error triggering webhook for event:", eventName, error);
    }
}
