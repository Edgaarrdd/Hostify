"use client";

import { useState } from "react";
import Link from "next/link";
import { performCheckIn, performCheckOut } from "@/lib/actions/checkin-checkout";
import { cancelReservation } from "@/lib/actions/reservations";
import { useRouter } from "next/navigation";

interface ReservationActionsProps {
    id: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    hasRoom: boolean;
}

/**
 * Componente que muestra botones de acción (Check-in, Check-out, Eliminar) según el estado de la reserva.
 * Encapsula la lógica de cuándo mostrar cada botón y maneja las confirmaciones de usuario.
 */
export function ReservationActions({
    id,
    status,
    checkInDate,
    // checkOutDate no se usa actualmente pero se mantiene para futuras mejoras o lógica de visualización
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    checkOutDate,
    hasRoom,
    hideView = false,
    hideDelete = false,
    hideCheckIn = false,
    hideCheckOut = false
}: ReservationActionsProps & { hideView?: boolean; hideDelete?: boolean; hideCheckIn?: boolean; hideCheckOut?: boolean }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCheckIn = async () => {
        if (!confirm("¿Confirmar Check-in para esta reserva?")) return;

        setLoading(true);
        const result = await performCheckIn(id);
        setLoading(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.message);
        }
    };

    const handleCheckOut = async () => {
        if (!confirm("¿Confirmar Check-out y liberar habitación?")) return;

        setLoading(true);
        const result = await performCheckOut(id);
        setLoading(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.message);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta reserva?")) return;

        setLoading(true);
        try {
            await cancelReservation(id);
        } catch {
            alert("Error al cancelar");
        } finally {
            setLoading(false);
        }
    };

    // Lógica para determinar qué botones mostrar
    // Check-in: Si el estado es 'Confirmada' o 'Pendiente' Y hoy es >= checkInDate (simplificado)
    // Por simplicidad, siempre mostramos Check-in si no está check-in/cancelada.

    const isToday = (dateString: string) => {
        const d = new Date(dateString);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    };

    const canCheckIn = !hideCheckIn && (status === 'Confirmada' || status === 'Pendiente') && hasRoom && isToday(checkInDate);
    const canCheckOut = !hideCheckOut && status === 'Check-in';

    return (
        <div className="flex items-center gap-2">
            {!hideView && (
                <Link href={`/protected/reservas/${id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
                    Ver
                </Link>
            )}

            {canCheckIn && (
                <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                >
                    Check-in
                </button>
            )}

            {canCheckOut && (
                <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                    Check-out
                </button>
            )}

            {!hideDelete && status !== 'Cancelada' && status !== 'Check-in' && status !== 'Finalizada' && (
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-2 text-sm"
                >
                    Eliminar
                </button>
            )}
        </div>
    );
}
