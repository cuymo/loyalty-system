/**
ID: api_0001
Endpoint de Server-Sent Events (SSE) para el envío de notificaciones en tiempo real al panel administrativo.
*/
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { eventBus, AdminEvent } from '@/lib/events';
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Send initial connection comment to immediately start the stream
    writer.write(encoder.encode(': connected\n\n'));

    const onEvent = async (event: AdminEvent) => {
        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch (error) {
            console.error('SSE Error:', error);
        }
    };

    // Listen to our global event bus
    eventBus.on('admin_notification', onEvent);

    // Keep connection alive with pings every 30 seconds
    const pingInterval = setInterval(() => {
        writer.write(encoder.encode(': ping\n\n')).catch(() => clearInterval(pingInterval));
    }, 30000);

    req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        eventBus.removeListener('admin_notification', onEvent);
        writer.close().catch(() => { });
    });

    return new Response(responseStream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Important for Nginx proxies
        },
    });
}
