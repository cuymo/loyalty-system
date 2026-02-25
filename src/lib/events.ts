import { EventEmitter } from "events";

// Ensure a single instance across hot reloads in development
const globalForEvents = global as unknown as { eventBus: EventEmitter };

export const eventBus = globalForEvents.eventBus || new EventEmitter();

// Increase max listeners to prevent memory leak warnings if many admin clients connect
eventBus.setMaxListeners(50);

if (process.env.NODE_ENV !== "production") {
    globalForEvents.eventBus = eventBus;
}

export type AdminEvent = {
    type: string;
    message: string;
    data?: any;
};
