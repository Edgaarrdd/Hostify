"use client";

import { useState } from "react";
import { finalizeReservationPayment } from "@/lib/actions/reservations";
import { Loader2 } from "lucide-react";

interface PaymentActionsProps {
    reservationId: string;
    pendingAmount: number;
}

export function PaymentActions({ reservationId, pendingAmount }: PaymentActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // Simular retraso de 5 segundos para feedback visual
            await new Promise(resolve => setTimeout(resolve, 5000));
            await finalizeReservationPayment(reservationId);
        } catch (error) {
            console.error("Payment failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando pago...
                </>
            ) : (
                `Pagar Restante ($${pendingAmount.toLocaleString("es-CL")})`
            )}
        </button>
    );
}
