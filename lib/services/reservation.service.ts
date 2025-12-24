
import { GuestRepository } from "@/lib/repositories/guest.repository";
import { ReservationRepository } from "@/lib/repositories/reservation.repository";
import { RoomRepository } from "@/lib/repositories/room.repository";
import { getPriceBreakdown } from "@/lib/utils/pricing";
import { Guest } from "@/components/reservas/guest-form";

export interface CreateReservationParams {
    guests: Record<string, Guest[]>;
    responsibleGuest: Guest;
    selectedRooms: { id: string; price: number }[];
    dateRange: { from: Date | string; to: Date | string };
    paymentData: { type: 'partial' | 'full'; amount: number; deposit: number; total: number; discount?: number };
    reservationCode: string;
    selectedServices?: { id: number; price: number; service?: string }[];
}

export class ReservationService {
    constructor(
        private guestRepo: GuestRepository,
        private reservationRepo: ReservationRepository,
        private roomRepo: RoomRepository
    ) { }

    async createReservation(params: CreateReservationParams, userId?: string) {
        const { responsibleGuest, selectedRooms, dateRange, paymentData, reservationCode, selectedServices } = params;

        // 1. Integrar Huésped (Responsible)
        let guestId: string;
        const existingGuest = await this.guestRepo.findByDocument(responsibleGuest.documentType, responsibleGuest.documentNumber);

        if (existingGuest) {
            guestId = existingGuest.id;
            // Update guest info just in case
            await this.guestRepo.update(guestId, {
                firstName: responsibleGuest.firstName,
                lastName: responsibleGuest.lastName,
                country: responsibleGuest.country,
                email: responsibleGuest.email,
                phone: responsibleGuest.phone,
            });
        } else {
            const newGuest = await this.guestRepo.create({
                documentType: responsibleGuest.documentType,
                documentNumber: responsibleGuest.documentNumber,
                firstName: responsibleGuest.firstName,
                lastName: responsibleGuest.lastName,
                country: responsibleGuest.country,
                city: responsibleGuest.city,
                birthDate: responsibleGuest.birthDate ? new Date(responsibleGuest.birthDate) : null,
                email: responsibleGuest.email,
                phone: responsibleGuest.phone,
            });
            guestId = newGuest.id;
        }

        // 2. Calcular Noches
        const nights = Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24));
        const servicesLimit = selectedServices?.reduce((acc, curr) => acc + curr.price, 0) || 0;

        // 3. Crear Reservas por Habitación
        const reservationPromises = selectedRooms.map(async (room, index) => {
            const isFirstRoom = index === 0;
            const roomBaseTotal = room.price * nights;
            const baseTotal = isFirstRoom ? (roomBaseTotal + servicesLimit) : roomBaseTotal;
            const discountFactor = paymentData.discount ? (1 - paymentData.discount / 100) : 1;
            const finalTotal = Math.round(baseTotal * discountFactor);

            // Calcular IVA
            const { price_net, iva_amount } = getPriceBreakdown(finalTotal);

            // Código dinámico y conteo de huéspedes
            const dynamicCode = index === 0 ? reservationCode : `${reservationCode}-${index}`;
            const guestsCount = Object.keys(params.guests).length > 0 && params.guests[room.id]
                ? params.guests[room.id].filter(g => g.firstName && g.lastName).length || 1
                : 1;

            const reservation = await this.reservationRepo.create({
                room_id: room.id,
                huesped_titular_id: guestId,
                created_by: userId,
                check_in: dateRange.from,
                check_out: dateRange.to,
                cantidad_noches: nights,
                total: finalTotal,
                subtotal: price_net,
                iva_amount: iva_amount,
                status: paymentData.type === 'full' ? 'Confirmada' : 'Pendiente',
                deposit_amount: paymentData.type === 'full' ? finalTotal : (isFirstRoom ? paymentData.deposit : 0),
                payment_status: paymentData.type === 'full' ? 'paid' : 'partial',
                payment_type: paymentData.type,
                reservation_code: dynamicCode,
                num_guests: guestsCount,
            });

            if (isFirstRoom && selectedServices && selectedServices.length > 0 && reservation) {
                const serviceInserts = selectedServices.map(s => ({
                    reservation_id: reservation.id,
                    service_id: s.id,
                    unit_price: s.price,
                    quantity: 1
                }));
                await this.reservationRepo.addServices(serviceInserts);
            }
            return reservation;
        });

        const results = await Promise.all(reservationPromises);

        // Retornar información útil para la siguiente etapa (Emails)
        return {
            success: true,
            reservationId: results[0]?.id,
            reservationCode,
            responsibleGuest,
            selectedRooms,
            dateRange,
            paymentData,
            nights,
            guestId,
            selectedServices
        };
    }

    // --- NEW BUSINESS LOGIC ---

    async cancelReservation(reservationId: string) {
        // 1. Get Reservation
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) throw new Error("Reserva no encontrada");

        // 2. Determine Logic
        let newPaymentStatus = reservation.payment_status;
        if (reservation.payment_status === 'partial') {
            newPaymentStatus = 'retained';
        } else if (reservation.payment_status === 'paid') {
            newPaymentStatus = 'refund_pending';
        }

        // 3. Update Status
        await this.reservationRepo.update(reservationId, {
            status: 'Cancelada',
            payment_status: newPaymentStatus
        });

        // 4. Release Room if occupied
        if (reservation.status === 'Check-in') {
            // Use RoomRepo to update status
            await this.roomRepo.updateStatus(reservation.room_id, 'Disponible');
        }

        return {
            success: true,
            reservation,
            newPaymentStatus
        };
    }

    async performCheckIn(reservationId: string) {
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) throw new Error("Reserva no encontrada");

        const pendingAmount = reservation.payment_status === 'partial'
            ? reservation.total - (reservation.deposit_amount || 0)
            : reservation.payment_status === 'pending' ? reservation.total : 0;

        if (pendingAmount > 0) throw new Error("Hay monto pendiente.");
        if (reservation.status === "Check-in") throw new Error("Ya tiene Check-in.");

        // Validate Room Status
        const room = await this.roomRepo.findById(reservation.room_id);
        if (room?.status === 'Ocupada') throw new Error("Habitación ocupada.");

        const todayYMD = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

        await this.reservationRepo.update(reservationId, {
            status: "Check-in",
            check_in: todayYMD
        });

        await this.roomRepo.updateStatus(reservation.room_id, "Ocupada");

        return { success: true, reservation };
    }

    async performCheckOut(reservationId: string) {
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) throw new Error("Reserva no encontrada");
        if (reservation.status !== "Check-in") throw new Error("Reserva no activa.");

        await this.reservationRepo.update(reservationId, {
            status: "Finalizada",
        });

        await this.roomRepo.updateStatus(reservation.room_id, "Disponible");

        return { success: true, reservation };
    }

    async finalizePayment(reservationId: string) {
        await this.reservationRepo.update(reservationId, {
            payment_status: 'paid',
            status: 'Confirmada',
            final_payment_at: new Date().toISOString()
        });
        return { success: true };
    }
    //
    async markRefunded(reservationId: string, amount: number) {
        await this.reservationRepo.update(reservationId, {
            payment_status: 'refunded',
            refund_amount: amount
        });
        return { success: true };
    }
}
