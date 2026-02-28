"use client";

import { Eye, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useModalStore } from "@/lib/modal-store";

export interface CodeBatch {
    batchName: string;
    count: number;
    usedCount: number;
}

interface BatchCardProps {
    batch: CodeBatch;
}

export function BatchCard({ batch }: BatchCardProps) {
    const { openModal } = useModalStore();

    const percentage = batch.count === 0 ? 0 : Math.round(((batch.usedCount || 0) / batch.count) * 100);
    const isExhausted = percentage === 100;

    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal("viewBatchModal", { batchName: batch.batchName });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal("deleteBatchAlert", { batchName: batch.batchName, isExhausted });
    };

    return (
        <Card
            className="overflow-hidden cursor-pointer hover:border-border/80 transition-colors"
            onClick={(e) => handleView(e)}
        >
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Package size={16} className="text-muted-foreground shrink-0" />
                        <h3 className="font-semibold text-foreground text-sm truncate">
                            {batch.batchName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={handleView}
                        >
                            <Eye size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Usados</span>
                        <span>{batch.usedCount || 0} / {batch.count}</span>
                    </div>
                    <div className="w-full h-2 bg-accent text-accent-foreground rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${percentage > 75
                                    ? "bg-destructive"
                                    : percentage > 40
                                        ? "bg-warning"
                                        : "bg-success"
                                }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {batch.count} códigos
                    </Badge>
                    {isExhausted && (
                        <Badge variant="destructive" className="text-xs">
                            Agotado
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
