"use client";

import { Button } from "@/components/ui/button";
import { Room } from "@/lib/actions/rooms";
import { getPriceBreakdown } from "@/lib/utils/pricing";

interface BookingSummaryProps {
    selectedRooms: Room[];
    onContinue: () => void;
    totalAmount: number;
    nights: number;
    buttonText?: string;
}

// BookingSummary es un componente que muestra el resumen de la reserva
export function BookingSummary({ selectedRooms, onContinue, totalAmount, nights, buttonText = "Continuar" }: BookingSummaryProps) {
    if (selectedRooms.length === 0) return null;

    // Validar que totalAmount sea un número válido
    const validTotal = typeof totalAmount === 'number' && !isNaN(totalAmount) ? totalAmount : 0;

    // Calcular desglose de IVA para el total
    const priceBreakdown = getPriceBreakdown(validTotal);

    return (
        <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark h-fit sticky top-6">
            <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">
                Resumen de reserva
            </h2>

            <div className="space-y-4 mb-6">
                <div>
                    <p className="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-2">
                        Habitaciones seleccionadas:
                    </p>
                    <ul className="space-y-2">
                        {selectedRooms.map((room) => ( //selectedRooms es un array de habitaciones que vienen de la pagina de reservas
                            <li key={room.id} className="flex justify-between text-sm">
                                <span>Habitación {room.number} ({room.type})</span>
                                <div className="flex flex-col items-end">
                                    <span className="font-medium">${(room.price_base * nights).toLocaleString()}</span>
                                    <span className="text-xs text-subtext-light dark:text-subtext-dark">
                                        por {nights} {nights === 1 ? 'noche' : 'noches'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Desglose de IVA */}
                <div className="pt-4 border-t border-border-light dark:border-border-dark space-y-2">
                    <div className="flex justify-between text-sm text-subtext-light dark:text-subtext-dark">
                        <span>Neto (sin IVA):</span>
                        <span>${priceBreakdown.price_net.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between text-sm text-subtext-light dark:text-subtext-dark">
                        <span>IVA (19%):</span>
                        <span>${priceBreakdown.iva_amount.toLocaleString("es-CL")}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-border-light dark:border-border-dark flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${validTotal.toLocaleString("es-CL")}</span>
                </div>
            </div>

            <Button
                onClick={onContinue} //onContinue es una funcion que se ejecuta cuando se hace click en el boton
                className="w-full"
                size="lg"
            >
                {buttonText}
            </Button>
        </div>
    );
}
