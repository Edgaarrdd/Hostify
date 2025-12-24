import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400", className)}
        >
            <Link
                href="/protected"
                className="hover:text-primary hover:underline transition-colors flex items-center"
                title="Inicio"
            >
                <Home className="h-4 w-4" />
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-primary hover:underline transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
