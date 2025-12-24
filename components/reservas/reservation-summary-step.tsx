import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Room } from "@/lib/actions/rooms";
import { Guest } from "@/components/reservas/guest-form";
import { Button } from "@/components/ui/button";
import { Service } from "@/lib/queries/services";
import { getPriceBreakdown } from "@/lib/utils/pricing";

interface ReservationSummaryStepProps {
    guests: Record<string, Guest[]>;
    selectedRooms: Room[];
    dateRange: { from: Date; to: Date };
    totalAmount: number;
    nights: number;
    selectedServices?: Service[];
    onConfirm: (paymentData: { type: 'partial' | 'full'; amount: number; discount?: number }) => void;
    onBack: () => void;
}

export function ReservationSummaryStep({
    guests,
    selectedRooms,
    dateRange,
    totalAmount,
    nights,
    selectedServices,
    onConfirm,
    onBack
}: ReservationSummaryStepProps) {
    const [paymentType, setPaymentType] = useState<'partial' | 'full'>('partial');
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);

    // Calcular total de huéspedes
    const totalGuests = Object.values(guests).reduce((acc, roomGuests) => {
        const filledGuests = roomGuests.filter(g => g.firstName && g.lastName);
        return acc + filledGuests.length;
    }, 0);

    // Encontrar huésped responsable
    let responsibleGuest: Guest | undefined;
    for (const roomId in guests) {
        const found = guests[roomId].find(g => g.isResponsible);
        if (found) {
            responsibleGuest = found;
            break;
        }
    }

    const discountedTotal = Math.round(totalAmount * (1 - discountPercentage / 100));
    const depositAmount = Math.round(discountedTotal * 0.3);
    const paymentAmount = paymentType === 'partial' ? depositAmount : discountedTotal;

    // Calcular desglose de IVA para el total a pagar
    const priceBreakdown = getPriceBreakdown(discountedTotal);

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            setDiscountPercentage(value);
        } else if (e.target.value === '') {
            setDiscountPercentage(0);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <h2 className="text-xl font-semibold">Resumen de Reserva</h2>

            <div className="flex flex-col gap-6">
                {/* Información General */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-2">
                    <h3 className="font-medium text-lg">Detalles Generales</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-muted-foreground flex justify-between">
                            <span>Cantidad de Huéspedes:</span>
                            <span className="font-medium text-foreground">{totalGuests}</span>
                        </p>
                        <p className="text-sm text-muted-foreground flex justify-between">
                            <span>Cantidad de Noches:</span>
                            <span className="font-medium text-foreground">{nights}</span>
                        </p>
                    </div>
                </div>

                {/* Huésped Responsable */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-2">
                    <h3 className="font-medium text-lg">Huésped Responsable</h3>
                    {responsibleGuest ? (
                        <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Nombre:</span> {responsibleGuest.firstName} {responsibleGuest.lastName}</p>
                            <p><span className="text-muted-foreground">Documento:</span> {responsibleGuest.documentType} {responsibleGuest.documentNumber}</p>
                            <p><span className="text-muted-foreground">Email:</span> {responsibleGuest.email}</p>
                            <p><span className="text-muted-foreground">Teléfono:</span> {responsibleGuest.phone}</p>
                        </div>
                    ) : (
                        <p className="text-red-500 text-sm">No se ha seleccionado huésped responsable.</p>
                    )}
                </div>

                {/* Habitaciones */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-medium text-lg">Habitaciones Seleccionadas</h3>
                    <div className="space-y-3">
                        {selectedRooms.map((room) => (
                            <div key={room.id} className="p-3 bg-background border rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Habitación {room.number || room.type}</span>
                                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                                        Cap: {room.capacity}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Huéspedes asignados: {guests[room.id]?.filter(g => g.firstName && g.lastName).length || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lista Detallada de Huéspedes por Habitación */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-medium text-lg">Huéspedes por Habitación</h3>
                    <div className="space-y-4">
                        {selectedRooms.map((room) => {
                            const roomGuests = guests[room.id]?.filter(g => g.firstName && g.lastName) || [];
                            if (roomGuests.length === 0) return null;

                            return (
                                <div key={room.id} className="border-l-4 border-primary pl-3">
                                    <h4 className="font-medium text-sm mb-2">Habitación {room.number || room.type}</h4>
                                    <div className="space-y-2">
                                        {roomGuests.map((guest, idx) => (
                                            <div key={idx} className="text-sm bg-muted/30 p-2 rounded">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">
                                                        {guest.firstName} {guest.lastName}
                                                        {guest.isResponsible && (
                                                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                                                Titular
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {guest.documentType} {guest.documentNumber}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Servicios Adicionales */}
                {selectedServices && selectedServices.length > 0 && (
                    <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                        <h3 className="font-medium text-lg">Servicios Adicionales</h3>
                        <div className="space-y-2">
                            {selectedServices.map((service, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span>{service.service}</span>
                                        {(service.start_time || service.end_time) && (
                                            <span className="text-xs text-muted-foreground">
                                                Horario: {service.start_time?.slice(0, 5) || ''} - {service.end_time?.slice(0, 5) || ''}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-medium">${service.price.toLocaleString("es-CL")}</span>
                                </div>
                            ))}
                            <div className="pt-2 border-t flex justify-between items-center font-medium">
                                <span>Total Servicios</span>
                                <span>${selectedServices.reduce((sum, s) => sum + s.price, 0).toLocaleString("es-CL")}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fechas y Totales */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-medium text-lg">Fechas y Totales</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="block text-muted-foreground text-xs">Check-in</span>
                            <span className="font-medium">{format(dateRange.from, "PPP", { locale: es })}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs">Check-out</span>
                            <span className="font-medium">{format(dateRange.to, "PPP", { locale: es })}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Subtotal Habitaciones:</span>
                            <span className="text-base font-semibold">
                                ${(totalAmount - (selectedServices?.reduce((sum, s) => sum + s.price, 0) || 0)).toLocaleString("es-CL")}
                            </span>
                        </div>
                        {selectedServices && selectedServices.length > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Subtotal Servicios:</span>
                                <span className="text-base font-semibold">
                                    ${selectedServices.reduce((sum, s) => sum + s.price, 0).toLocaleString("es-CL")}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-medium">Total General:</span>
                            <span className="text-base font-bold">
                                ${totalAmount.toLocaleString("es-CL")}
                            </span>
                        </div>

                        <div className="flex justify-between items-center gap-4 mt-2">
                            <label htmlFor="discount" className="text-sm text-muted-foreground whitespace-nowrap">
                                Descuento (%):
                            </label>
                            <input
                                id="discount"
                                type="number"
                                min="0"
                                max="100"
                                value={discountPercentage}
                                onChange={handleDiscountChange}
                                className="w-20 p-1 border rounded text-right text-sm"
                            />
                        </div>

                        {discountPercentage > 0 && (
                            <div className="flex justify-between items-center text-green-600">
                                <span className="text-sm">Descuento aplicado:</span>
                                <span className="text-base font-semibold">
                                    - ${(totalAmount - discountedTotal).toLocaleString("es-CL")}
                                </span>
                            </div>
                        )}

                        {/* Desglose de IVA */}
                        <div className="space-y-1 pt-2 border-t">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Neto (sin IVA):</span>
                                <span>${priceBreakdown.price_net.toLocaleString("es-CL")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>IVA (19%):</span>
                                <span>${priceBreakdown.iva_amount.toLocaleString("es-CL")}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end pt-2 border-t">
                            <span className="text-sm text-muted-foreground">Total a pagar:</span>
                            <span className="text-xl font-bold text-primary">
                                ${discountedTotal.toLocaleString("es-CL")}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground text-right mt-1">
                            {selectedRooms.length} habitaciones x {nights} noches
                            {selectedServices && selectedServices.length > 0 && ` + ${selectedServices.length} servicios`}
                        </p>
                    </div>
                </div>

                {/* Opciones de Pago */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-medium text-lg">Opciones de Pago</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentType === 'partial' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            onClick={() => setPaymentType('partial')}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Pagar Anticipo (30%)</span>
                                {paymentType === 'partial' && <div className="h-4 w-4 rounded-full bg-primary" />}
                            </div>
                            <p className="text-2xl font-bold text-primary">${depositAmount.toLocaleString("es-CL")}</p>
                            <p className="text-xs text-muted-foreground mt-1">Paga el resto al llegar al hotel.</p>
                        </div>

                        <div
                            className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentType === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            onClick={() => setPaymentType('full')}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Pagar Total (100%)</span>
                                {paymentType === 'full' && <div className="h-4 w-4 rounded-full bg-primary" />}
                            </div>
                            <p className="text-2xl font-bold text-primary">${discountedTotal.toLocaleString("es-CL")}</p>
                            <p className="text-xs text-muted-foreground mt-1">Reserva totalmente pagada.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={onBack} size="lg" className="w-full md:w-auto">
                    Volver
                </Button>
                <Button
                    onClick={() => onConfirm({ type: paymentType, amount: paymentAmount, discount: discountPercentage })}
                    size="lg"
                    className="w-full md:w-auto"
                >
                    Pagar ${paymentAmount.toLocaleString("es-CL")}
                </Button>
            </div>
        </div>
    );
}
