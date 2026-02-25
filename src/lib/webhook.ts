import { db } from "@/db";
import { settings, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function triggerWebhook(eventName: string, data: any) {
    try {
        // 1. Get all settings
        const allSettings = await db.select().from(settings);

        // 2. Get webhook URLs (new multi-URL format)
        let urls: string[] = [];
        const webhookUrlsSetting = allSettings.find(s => s.key === "webhook_urls");
        if (webhookUrlsSetting && webhookUrlsSetting.value) {
            try {
                const parsed = JSON.parse(webhookUrlsSetting.value);
                if (Array.isArray(parsed)) {
                    urls = parsed.filter((u: string) => u && u.trim() !== "");
                }
            } catch {
                // Fallback: try old single URL
            }
        }

        // Fallback to old webhook_global_url if no multi-URLs
        if (urls.length === 0) {
            const globalUrlSetting = allSettings.find(s => s.key === "webhook_global_url");
            if (globalUrlSetting && globalUrlSetting.value) {
                urls = [globalUrlSetting.value];
            }
        }

        if (urls.length === 0) {
            return; // No webhooks configured
        }

        // 3. Check if the event is active (auto-register if missing)
        let [event] = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.eventName, eventName))
            .limit(1);

        if (!event) {
            // Auto-register the event so it shows up in admin/integrations
            await db.insert(webhookEvents).values({
                eventName,
                webhookUrl: null,
                isActive: false,
            });
            return; // New event — inactive by default, admin must activate
        }

        if (!event.isActive) {
            return; // Event exists but not active
        }

        // 4. Send POST request to ALL URLs
        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data,
        };

        for (const url of urls) {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }).catch(err => console.error(`Webhook fetch failed for ${url}:`, err));
        }

    } catch (error) {
        console.error("Error triggering webhook for event:", eventName, error);
    }
}
