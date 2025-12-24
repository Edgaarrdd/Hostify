"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useState, useEffect } from "react";

export default function Search({ placeholder }: { placeholder: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [inputValue, setInputValue] = useState(searchParams.get("query")?.toString() || "");

    useEffect(() => {
        setInputValue(searchParams.get("query")?.toString() || "");
    }, [searchParams]);

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    return (
        <div className="relative flex flex-1 flex-shrink-0">
            <label htmlFor="search" className="sr-only">
                Buscar
            </label>
            <input
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-muted text-foreground"
                placeholder={placeholder}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    handleSearch(e.target.value);
                }}
                value={inputValue}
                autoComplete="off"
            />
        </div>
    );
}
