self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const options = {
            body: data.body || "Tienes una nueva notificación",
            icon: data.icon || "/icon-192x192.png",
            badge: data.badge || "/icon-192x192.png",
            vibrate: [100, 50, 100],
            data: {
                url: data.url || "/",
            },
        };

        event.waitUntil(
            self.registration.showNotification(data.title || "Notificación de Zingy", options)
        );
    } catch (e) {
        // Fallback for plain text payload
        event.waitUntil(
            self.registration.showNotification(event.data.text() || "Notificación de Zingy")
        );
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
