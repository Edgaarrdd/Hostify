"use client";

import { useState } from "react";
import { markReservationRefunded } from "@/lib/actions/reservations";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RefundActionsProps {
    reservationId: string;
    refundAmount: number;
}

export function RefundActions({ reservationId, refundAmount }: RefundActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleRefund = async () => {
        setIsLoading(true);
        try {
            // Simular retraso de 5 segundos para feedback visual (como se solicitó: "simulación de reembolso")
            await new Promise(resolve => setTimeout(resolve, 5000));
            const result = await markReservationRefunded(reservationId, refundAmount);

            if (result.success) {
                toast.success("Devolución solicitada con éxito");
            } else {
                toast.error("Error al solicitar devolución: " + result.error);
            }
        } catch (error: unknown) {
            console.error("Refund failed:", error);
            const msg = error instanceof Error ? error.message : "Error desconocido";
            toast.error("Error inesperado: " + msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleRefund}
            disabled={isLoading}
            className="w-full bg-red-600 text-white hover:bg-red-700 font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 mt-4"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando devolución...
                </>
            ) : (
                `Solicitar devolución ($${refundAmount.toLocaleString("es-CL")})`
            )}
        </button>
    );
}
