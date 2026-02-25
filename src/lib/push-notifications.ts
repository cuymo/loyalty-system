export async function subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { success: false, error: "Las notificaciones push no son compatibles con este navegador." };
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            return { success: false, error: "Permiso de notificaciones denegado." };
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
            console.error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en .env");
            return { success: false, error: "Configuración del servidor incompleta." };
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Parse format to get endpoint and keys directly
        const subData = subscription.toJSON();

        if (!subData.endpoint || !subData.keys) {
            return { success: false, error: "Fallo al generar llaves de subscripción." };
        }

        return {
            success: true,
            subscription: {
                endpoint: subData.endpoint,
                keys: {
                    p256dh: subData.keys.p256dh,
                    auth: subData.keys.auth
                }
            }
        };
    } catch (error: any) {
        console.error("Error al suscribirse:", error);
        return { success: false, error: error.message || "Error desconocido al suscribirse." };
    }
}

export async function unsubscribeFromPushNotifications() {
    if (!('serviceWorker' in navigator)) return { success: true };

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();
            return { success: true, endpoint };
        }
        return { success: true };
    } catch (error) {
        console.error("Error al de-suscribirse:", error);
        return { success: false };
    }
}

// Helper para convertir el public key string de VAPID a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
