"use client";

import { useEffect, useState } from "react";

/**
 * Hook to check the current media query size
 * @param query Mobile/Desktop media query (e.g. "(min-width: 768px)")
 * @returns boolean
 */
export function useMediaQuery(query: string) {
    const [value, setValue] = useState(false);

    useEffect(() => {
        function onChange(event: MediaQueryListEvent) {
            setValue(event.matches);
        }

        const result = window.matchMedia(query);
        result.addEventListener("change", onChange);
        setValue(result.matches);

        return () => result.removeEventListener("change", onChange);
    }, [query]);

    return value;
}
