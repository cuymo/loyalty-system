export function ClientAuthNotice({ notice }: { notice?: string | null }) {
    if (!notice) return null;

    return (
        <div className="p-4 bg-muted/40 border border-warning/30 rounded-2xl shadow-sm">
            <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{notice}</p>
        </div>
    );
}
