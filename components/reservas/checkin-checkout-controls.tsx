"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { performCheckIn, performCheckOut } from "@/lib/actions/checkin-checkout";
import { useRouter } from "next/navigation";

interface CheckInCheckOutControlsProps {
    type: 'check-in' | 'check-out';
    reservationId: string;
    status: string;
    scheduledDate: string | Date;
    actualDate?: string | Date | null;
    hasRoom: boolean;
    pendingAmount?: number;
}

export function CheckInCheckOutControls({
    type,
    reservationId,
    status,
    scheduledDate,
    actualDate,
    hasRoom,
    pendingAmount = 0
}: CheckInCheckOutControlsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAction = async () => {
        if (type === 'check-in' && pendingAmount > 0) {
            alert("No se puede realizar el Check-in si existe un monto pendiente.");
            return;
        }
        const actionName = type === 'check-in' ? 'Check-in' : 'Check-out';
        if (!confirm(`¿Confirmar ${actionName}?`)) return;

        setLoading(true);
        try {
            const result = type === 'check-in'
                ? await performCheckIn(reservationId)
                : await performCheckOut(reservationId);

            if (result.success) {
                router.refresh();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    // Helper para verificar si hoy coincide con la fecha programada (ignorando la hora)
    const isTodayOrPast = (dateInput: string | Date) => {
        const dateStr = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
        const ymd = dateStr.split('T')[0];
        const [year, month, day] = ymd.split('-').map(Number);
        const scheduled = new Date(year, month - 1, day);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return now >= scheduled;
    };

    // Determinar si debemos mostrar el botón
    const showButton = (() => {
        if (actualDate) return false; // Ya realizado

        if (type === 'check-in') {
            // Mostrar botón si el estado es Confirmada/Pendiente y tiene habitación
            // la validación ocurre en el render
            return (status === 'Confirmada' || status === 'Pendiente') && hasRoom;
        }

        if (type === 'check-out') {
            // Mostrar botón de Check-out si el estado es 'Check-in'
            return status === 'Check-in';
        }

        return false;
    })();

    if (actualDate) {
        return (
            <div className="mt-1">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {type === 'check-in' ? "Llegada: " : "Salida: "}
                </span>
                <span className="text-sm text-foreground">
                    {format(new Date(actualDate), "dd MMM yyyy, HH:mm", { locale: es })}
                </span>
            </div>
        );
    }

    if (showButton) {
        let isDisabled = loading;
        let tooltip = "";

        if (type === 'check-in') {
            const isDateValid = isTodayOrPast(scheduledDate);
            const isPaid = pendingAmount <= 0;

            if (!isDateValid) {
                isDisabled = true;
                tooltip = `El Check-in solo se puede realizar a partir del ${format(new Date(scheduledDate), "dd MMM yyyy", { locale: es })}`;
            } else if (!isPaid) {
                isDisabled = true;
                tooltip = "Debe completar el pago para hacer check-in";
            }
        }

        return (
            <button
                onClick={handleAction}
                disabled={isDisabled}
                className={`mt-2 w-full sm:w-auto px-3 py-1.5 rounded text-sm font-medium text-white transition-colors disabled:opacity-50 ${type === 'check-in'
                    ? isDisabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                title={tooltip}
            >
                {loading ? "Procesando..." : type === 'check-in' ? "Realizar Check-in" : "Realizar Check-out"}
            </button>
        );
    }

    return null;
}