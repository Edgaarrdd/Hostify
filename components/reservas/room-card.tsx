"use client";

import { cn } from "@/lib/utils";
import { User, BedDouble, BedSingle } from "lucide-react";
import { Room } from "@/lib/actions/rooms";

interface RoomCardProps {
    room: Room;
    isSelected?: boolean;
    onSelect?: () => void;
    disabled?: boolean;
}

export function RoomCard({ room, isSelected, onSelect, disabled }: RoomCardProps) {
    return (
        <div
            onClick={!disabled ? onSelect : undefined}
            className={cn(
                "cursor-pointer rounded-xl border p-4 transition-all duration-200",
                isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border-light dark:border-border-dark bg-content-light dark:bg-content-dark hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-text-light dark:text-text-dark flex-1">
                    Habitación {room.number}
                </h3>
                <span className="font-semibold text-primary ml-4">
                    ${room.price_base.toLocaleString("es-ES")}
                </span>
            </div>

            <div className="space-y-1 text-sm text-subtext-light dark:text-subtext-dark">
                <div className="flex items-center gap-2">
                    {room.type === "doble" ? <BedDouble className="w-4 h-4" /> : <BedSingle className="w-4 h-4" />}
                    <span className="capitalize">{room.type}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{room.capacity} Huéspedes</span>
                </div>
            </div>
        </div>
    );
}
