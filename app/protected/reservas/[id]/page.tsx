// Desde acá se maneja la vista de una reserva, es decir, se muestra la información de una reserva en particular
import { getReservationById } from "@/lib/actions/reservations";
import { PaymentActions } from "@/components/reservas/payment-actions";
import { ReservationActions } from "@/components/reservas/reservation-actions";
import { CheckInCheckOutControls } from "@/components/reservas/checkin-checkout-controls";
import { RefundActions } from "@/components/reservas/refund-actions";
import { getPriceBreakdown } from "@/lib/utils/pricing";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { notFound } from "next/navigation";

// HELPER: Para mostrar la fecha tal cual viene de la BD sin que se reste un día por la zona horaria
function parseDateVisual(dateStr: string) {
    if (!dateStr) return new Date();
    // Convertimos "2025-12-12" a una fecha a las 12:00 del día para evitar problemas de medianoche
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

// NUEVO HELPER: SOLO CAMBIO DE HORA (Resta 3 horas al horario UTC para dar hora Chile)
function formatHoraChile(dateInput: string | Date | undefined) {
    if (!dateInput) return "-";
    const date = new Date(dateInput);
    date.setHours(date.getHours() - 3);
    return date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// INTERFACES PARA EL COMPONENTE
interface GuestData {
    id: string;
    nombre: string;
    apellido: string;
    tipo_documento: string;
    numero_documento: string;
    email: string | null;
    telefono: string | null;
    pais_origen: string | null;
    ciudad: string | null;
    fecha_nacimiento: string | null;
}

interface ReservationGuestIntermedia {
    id: string;
    rol: string;
    guests: GuestData;
}

// Esta funcion es la que se encarga de mostrar la informacion de una reserva en particular
export default async function ReservationDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { id } = await params;
    const { from } = await searchParams;
    const reservation = await getReservationById(id);

    if (!reservation) {
        notFound();
    }

    // CAMBIO AQUI: Usamos parseDateVisual en lugar de new Date() directo
    const checkIn = parseDateVisual(reservation.check_in);
    const checkOut = parseDateVisual(reservation.check_out);

    const pendingAmount = reservation.payment_status === 'paid'
        ? 0
        : reservation.total - (reservation.deposit_amount || 0);
    const servicesTotal = reservation.reservation_services?.reduce((acc: number, curr: { quantity: number; unit_price: number }) => acc + (curr.quantity * curr.unit_price), 0) || 0;
    const roomTotal = (reservation.rooms?.price_base || 0) * (reservation.cantidad_noches || 0);
    const grossTotal = roomTotal + servicesTotal;
    const discountAmount = grossTotal - (reservation.total || 0);
    const hasDiscount = discountAmount > 0;
    const discountPercentage = hasDiscount ? Math.round((discountAmount / grossTotal) * 100) : 0;

    // Cálculo de IVA
    const priceBreakdown = getPriceBreakdown(reservation.total || 0);

    const backUrl = from === 'dashboard' ? '/protected' : from === 'habitaciones' ? '/protected/habitaciones' : '/protected/reservas';

    // crea un objeto con la informacion de la reserva
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Reserva {reservation.reservation_code || 'N/A'}</h1>
                    <p className="text-subtext-light dark:text-subtext-dark">Detalle de la reserva</p>
                </div>
                <div className="flex items-center gap-4">
                    <ReservationActions
                        id={reservation.id}
                        status={reservation.status}
                        checkInDate={reservation.check_in}
                        checkOutDate={reservation.check_out}
                        hasRoom={!!reservation.rooms}
                        hideView={true}
                        hideCheckIn={true}
                        hideCheckOut={true}
                    />
                    <Link
                        href={backUrl}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        Volver
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del Huésped */}
                <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Huésped Responsable</h2>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm text-muted-foreground block">Nombre completo</span>
                            <span className="text-lg font-medium text-foreground">{reservation.guests?.nombre} {reservation.guests?.apellido}</span>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground block">Email</span>
                            <span className="text-foreground">{reservation.guests?.email}</span>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground block">Teléfono</span>
                            <span className="text-foreground">{reservation.guests?.telefono || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground block">Documento</span>
                            <span className="text-foreground uppercase">{reservation.guests?.tipo_documento} - {reservation.guests?.numero_documento}</span>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground block">Origen</span>
                            <span className="text-foreground">{reservation.guests?.ciudad}, {reservation.guests?.pais_origen}</span>
                        </div>
                    </div>
                </div>

                {/* Información de la Estadía */}
                <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Detalles de la Estadía</h2>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground block">Check-in</span>
                                <span className="text-lg font-medium text-foreground">{format(checkIn, "dd MMM yyyy", { locale: es })}</span>  {/* Formatea la fecha de check-in */}
                                <CheckInCheckOutControls
                                    type="check-in"
                                    reservationId={reservation.id}
                                    status={reservation.status}
                                    scheduledDate={reservation.check_in}
                                    actualDate={reservation.actual_check_in}
                                    hasRoom={!!reservation.rooms}
                                    pendingAmount={pendingAmount}
                                />
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">Check-out</span>
                                <span className="text-lg font-medium text-foreground">{format(checkOut, "dd MMM yyyy", { locale: es })}</span>
                                <CheckInCheckOutControls
                                    type="check-out"
                                    reservationId={reservation.id}
                                    status={reservation.status}
                                    scheduledDate={reservation.check_out}
                                    actualDate={reservation.actual_check_out}
                                    hasRoom={!!reservation.rooms}
                                />
                            </div>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground block">Duración</span>
                            <span className="text-foreground">{reservation.cantidad_noches} noches</span>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground block">Encargado</span>
                            <span className="text-foreground font-medium">{reservation.creator?.full_name || "Desconocido"}</span>
                        </div>
                        <div className="pt-2 border-t border-border mt-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm text-muted-foreground block">Habitación</span>
                                    <span className="text-lg font-bold text-primary">{reservation.rooms?.number}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-muted-foreground block">Tipo</span>
                                    <span className="capitalize px-2 py-1 bg-gray-100 dark:bg-muted rounded text-sm">{reservation.rooms?.type}</span>
                                </div>
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-sm text-muted-foreground block">Huéspedes</span>
                                <span className="text-foreground font-medium">{reservation.num_guests || 1}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Todos los Huéspedes */}
            {reservation.reservation_guests_intermedia && reservation.reservation_guests_intermedia.length > 0 && (
                <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">
                        Huéspedes de la Reserva ({reservation.reservation_guests_intermedia.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Nombre</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Documento</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Email</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Teléfono</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Origen</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">Rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {reservation.reservation_guests_intermedia.map((item: ReservationGuestIntermedia) => (
                                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-foreground">
                                            {item.guests?.nombre} {item.guests?.apellido}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground uppercase">
                                            {item.guests?.tipo_documento} - {item.guests?.numero_documento}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {item.guests?.email || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {item.guests?.telefono || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {item.guests?.ciudad ? `${item.guests.ciudad}, ${item.guests.pais_origen}` : item.guests?.pais_origen || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.rol === 'Titular'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                                }`}>
                                                {item.rol}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">


                {/* Información Financiera */}
                <div className="md:col-span-2 bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Información de Pago</h2>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${reservation.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : reservation.payment_status === 'partial'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : reservation.payment_status === 'refund_pending'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                            : reservation.payment_status === 'refunded'
                                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                                : reservation.payment_status === 'retained'
                                                    ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                    {reservation.payment_status === 'paid'
                                        ? 'Pagado Totalmente'
                                        : reservation.payment_status === 'partial'
                                            ? 'Abonado Parcialmente'
                                            : reservation.payment_status === 'refund_pending'
                                                ? 'Devolución en proceso'
                                                : reservation.payment_status === 'refunded'
                                                    ? 'Devolución realizada'
                                                    : reservation.payment_status === 'retained'
                                                        ? 'Reembolso retenido'
                                                        : 'Pago Pendiente'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Estado: {reservation.status === 'Pendiente' && reservation.payment_status === 'paid' ? 'Confirmada' : reservation.status}
                                </span>
                            </div>

                            {['paid', 'partial'].includes(reservation.payment_status) && ( // includes verifica si el pago es parcial o total
                                <div className="mt-4 w-full">
                                    <h3 className="text-sm font-semibold mb-2 text-foreground">Historial de Pagos</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-[510px] text-left">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="px-3 py-2 text-sm font-medium text-muted-foreground">Concepto</th>
                                                        <th className="px-3 py-2 text-sm font-medium text-muted-foreground">Fecha</th>
                                                        <th className="px-3 py-2 text-sm font-medium text-muted-foreground">Hora</th>
                                                        <th className="px-3 py-2 text-sm font-medium text-muted-foreground text-right">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border bg-card">
                                                    {/* Lógica para Pago Dividido vs Pago Completo Inmediato */}
                                                    {(reservation.deposit_amount ?? 0) > 0 && reservation.deposit_amount < reservation.total ? (
                                                        // Caso de Pago Dividido
                                                        <>
                                                            <tr>
                                                                <td className="px-3 py-2 text-sm">Anticipo (30%)</td>
                                                                <td className="px-3 py-2 text-sm">{reservation.created_at ? formatInTimeZone(new Date(reservation.created_at), 'America/Santiago', "dd/MM/yyyy", { locale: es }) : "-"}</td>
                                                                {/* CAMBIO DE HORA AQUI */}
                                                                <td className="px-3 py-2 text-sm">{formatHoraChile(reservation.created_at)}</td>
                                                                <td className="px-3 py-2 text-sm text-right font-mono">${reservation.deposit_amount?.toLocaleString("es-CL")}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="px-3 py-2 text-sm">Pago Restante</td>
                                                                <td className="px-3 py-2 text-sm">{reservation.final_payment_at ? formatInTimeZone(new Date(reservation.final_payment_at), 'America/Santiago', "dd/MM/yyyy", { locale: es }) : "-"}</td>
                                                                {/* CAMBIO DE HORA AQUI */}
                                                                <td className="px-3 py-2 text-sm">{formatHoraChile(reservation.final_payment_at)}</td>
                                                                <td className="px-3 py-2 text-sm text-right font-mono">${(reservation.total - (reservation.deposit_amount || 0)).toLocaleString("es-CL")}</td>
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        // Caso de Pago Completo Inmediato
                                                        <tr>
                                                            <td className="px-3 py-2 text-sm">Pago Completo</td>
                                                            <td className="px-3 py-2 text-sm">{reservation.created_at ? formatInTimeZone(new Date(reservation.created_at), 'America/Santiago', "dd/MM/yyyy", { locale: es }) : "-"}</td>
                                                            {/* CAMBIO DE HORA AQUI */}
                                                            <td className="px-3 py-2 text-sm">{formatHoraChile(reservation.created_at)}</td>
                                                            <td className="px-3 py-2 text-sm text-right font-mono">${reservation.total?.toLocaleString("es-CL")}</td>
                                                        </tr>
                                                    )}

                                                    {/* Renderizar Servicios */}
                                                    {reservation.reservation_services?.map((service: { quantity: number; unit_price: number; services: { service: string } | null }, index: number) => (
                                                        <tr key={`service-${index}`} className="bg-muted/10">
                                                            <td className="px-3 py-2 text-sm text-foreground/80">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-blue-400 font-bold text-lg leading-none mr-1">+</span>
                                                                    Servicio: {service.services?.service}
                                                                    {service.quantity > 1 && ` (x${service.quantity})`}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-muted-foreground">{reservation.created_at ? formatInTimeZone(new Date(reservation.created_at), 'America/Santiago', "dd/MM/yyyy", { locale: es }) : "-"}</td>
                                                            {/* CAMBIO DE HORA AQUI (MANTENIENDO CLASES) */}
                                                            <td className="px-3 py-2 text-sm text-muted-foreground">{formatHoraChile(reservation.created_at)}</td>
                                                            <td className="px-3 py-2 text-sm text-right font-mono text-foreground/80">${(service.quantity * service.unit_price).toLocaleString("es-CL")}</td>
                                                        </tr>
                                                    ))}

                                                    {reservation.status === 'Cancelada' && (
                                                        <tr>
                                                            <td className="px-3 py-2 text-sm text-red-600 dark:text-red-400 font-medium">Devolución</td>
                                                            <td className="px-3 py-2 text-sm">-</td>
                                                            <td className="px-3 py-2 text-sm">-</td>
                                                            <td className="px-3 py-2 text-sm text-right font-mono text-red-600 dark:text-red-400">
                                                                ${(reservation.payment_status === 'refund_pending'
                                                                    ? Math.round(reservation.total * 0.75)
                                                                    : reservation.refund_amount || (reservation.payment_status === 'refunded' ? Math.round(reservation.total * 0.75) : 0)
                                                                ).toLocaleString("es-CL")}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="bg-muted/20 font-semibold">
                                                        <td className="px-3 py-2 text-sm">Total a Pagar</td>
                                                        <td className="px-3 py-2 text-sm text-muted-foreground">-</td>
                                                        <td className="px-3 py-2 text-sm text-muted-foreground">-</td>
                                                        <td className="px-3 py-2 text-sm text-right font-mono text-green-600 dark:text-green-400">${reservation.total?.toLocaleString("es-CL")}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className=" w-full md:w-auto bg-gray-50 dark:bg-muted/30 p-4 rounded-lg min-w-[320px]">
                            <h2 className="text-sm font-semibold mb-3 text-foreground">Resumen de pago:</h2>
                            <div className="space-y-1 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Precio Habitación:</span>
                                    <span className="text-muted-foreground">${roomTotal.toLocaleString("es-CL")}</span>
                                </div>
                                {servicesTotal > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Servicios Adicionales:</span>
                                        <span className="text-muted-foreground">${servicesTotal.toLocaleString("es-CL")}</span>
                                    </div>
                                )}
                                {hasDiscount && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 dark:text-green-400">
                                            Descuento ({discountPercentage}%):
                                        </span>
                                        <span className="text-green-600 dark:text-green-400">
                                            -${discountAmount.toLocaleString("es-CL")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Desglose de IVA */}
                            <div className="space-y-1 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Neto (sin IVA):</span>
                                    <span>${priceBreakdown.price_net.toLocaleString("es-CL")}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>IVA (19%):</span>
                                    <span>${priceBreakdown.iva_amount.toLocaleString("es-CL")}</span>
                                </div>
                            </div>

                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Total Final:</span>
                                <span className="font-semibold">${reservation.total?.toLocaleString("es-CL")}</span>
                            </div>
                            {reservation.payment_status === 'partial' && reservation.status !== 'Cancelada' && (
                                <>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-green-600 dark:text-green-400">Abonado:</span>
                                        <span className="text-green-600 dark:text-green-400">-${reservation.deposit_amount?.toLocaleString("es-CL")}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 mb-4">
                                        <span className="font-bold text-red-600 dark:text-red-400">Monto Pendiente:</span>
                                        <span className="font-bold text-xl text-red-600 dark:text-red-400">${pendingAmount.toLocaleString("es-CL")}</span>
                                    </div>
                                    <PaymentActions reservationId={reservation.id} pendingAmount={pendingAmount} />
                                </>
                            )}

                            {reservation.status === 'Cancelada' && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold mb-2">Resumen Cancelación</h4>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Total Recibido:</span>
                                        <span>${(reservation.payment_status === 'partial' ? (reservation.deposit_amount || 0) : reservation.total).toLocaleString("es-CL")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-red-500">Monto Devuelto (70%):</span>
                                        <span className="text-red-500">-${(reservation.refund_amount ?? ((reservation.payment_status === 'refund_pending' || reservation.payment_status === 'refunded') ? Math.round(reservation.total * 0.7) : 0)).toLocaleString("es-CL")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-300 pt-2 mt-2">
                                        <span className="text-green-600">Ganancia Hotel:</span>
                                        <span className="text-green-600">${((reservation.payment_status === 'partial' ? (reservation.deposit_amount || 0) : reservation.total) - (reservation.refund_amount ?? ((reservation.payment_status === 'refund_pending' || reservation.payment_status === 'refunded') ? Math.round(reservation.total * 0.7) : 0))).toLocaleString("es-CL")}</span>
                                    </div>
                                </div>
                            )}

                            {reservation.status === 'Cancelada' && reservation.payment_status === 'refund_pending' && (
                                <RefundActions
                                    reservationId={reservation.id}
                                    refundAmount={Math.round(reservation.total * 0.7)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}