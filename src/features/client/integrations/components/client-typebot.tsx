/**
ID: ui_0009
Burbuja flotante de asistencia virtual que integra Typebot para soporte al cliente.
*/
"use client";

import { Standard } from "@typebot.io/react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";

export function ClientTypebotBubble({
    typebotUrl,
}: {
    typebotUrl: string;
}) {
    if (!typebotUrl) return null;

    try {
        const url = new URL(typebotUrl);
        const typebotId = url.pathname.substring(1);
        const apiHost = url.origin;

        if (!typebotId || !apiHost) return null;

        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-9 h-9 border border-border bg-card text-foreground hover:bg-accent transition-colors"
                        title="Ayuda"
                    >
                        <Bot size={18} />
                        <span className="sr-only">Ayuda</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col pt-12 border-l shadow-2xl">
                    <SheetTitle className="sr-only">Asistente Virtual</SheetTitle>
                    <div className="flex-1 w-full h-full relative">
                        <Standard
                            typebot={typebotId}
                            apiHost={apiHost}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        );
    } catch {
        return null;
    }
}
