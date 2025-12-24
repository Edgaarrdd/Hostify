"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Guest } from "@/components/reservas/guest-form";
<<<<<<< HEAD
import { sendReservationEmail } from "@/lib/email";
=======
import { toZonedTime, format } from "date-fns-tz";
import { sendReservationEmail } from "@/lib/services/email";
>>>>>>> eab6217484b48093428b6d0039c51b3e208e30ec
import { getPriceBreakdown } from "@/lib/utils/pricing";
import { GuestRepository } from "@/lib/repositories/guest.repository";
import { ReservationRepository } from "@/lib/repositories/reservation.repository";
import { RoomRepository } from "@/lib/repositories/room.repository";
import { ReservationService } from "@/lib/services/reservation.service";

// --- INTERFACES ---
export interface CreateReservationParams {
    guests: Record<string, Guest[]>;
    responsibleGuest: Guest;
    selectedRooms: { id: string; price: number }[];
    dateRange: { from: Date | string; to: Date | string };
    paymentData: { type: 'partial' | 'full'; amount: number; deposit: number; total: number; discount?: number };
    reservationCode: string;
    selectedServices?: { id: number; price: number; service?: string }[];
}



// --- 1. CREAR RESERVA (REFACTORIZADO A CLEAN ARCHITECTURE) ---
export async function createReservation(params: CreateReservationParams) {
    const supabase = await createClient();

    // --- CLEAN ARCHITECTURE INITIALIZATION ---
    // Instantiate Repositories
    const guestRepo = new GuestRepository(supabase);
    const reservationRepo = new ReservationRepository(supabase);
    const roomRepo = new RoomRepository(supabase);

    // Instantiate Service
    const reservationService = new ReservationService(guestRepo, reservationRepo, roomRepo);

    try {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Execute Logic via Service
        const serviceResult = await reservationService.createReservation(params, user?.id);

<<<<<<< HEAD
        // 2. Extract Data for Email Notification
        const {
            reservationId,
            responsibleGuest,
            dateRange,
            nights,
            paymentData,
            selectedRooms,
            reservationCode,
            selectedServices
        } = serviceResult;
=======
        let guestId = existingGuest?.id;

        if (!guestId) {
            const { data: newGuest, error: createError } = await supabase
                .from("guests")
                .insert({
                    tipo_documento: responsibleGuest.documentType,
                    numero_documento: responsibleGuest.documentNumber,
                    nombre: responsibleGuest.firstName,
                    apellido: responsibleGuest.lastName,
                    pais_origen: responsibleGuest.country, // TU CAMBIO (Importante para IA)
                    ciudad: responsibleGuest.city,
                    fecha_nacimiento: responsibleGuest.birthDate ? new Date(responsibleGuest.birthDate) : null,
                    email: responsibleGuest.email,
                    telefono: responsibleGuest.phone,
                })
                .select("id")
                .single();

            if (createError) throw new Error(`Error creating guest: ${createError.message}`);
            guestId = newGuest.id;
        } else {
            await supabase.from("guests").update({
                nombre: responsibleGuest.firstName,
                apellido: responsibleGuest.lastName,
                pais_origen: responsibleGuest.country, // TU CAMBIO
                email: responsibleGuest.email,
                telefono: responsibleGuest.phone,
            }).eq("id", guestId);
        }

        // 2. Crear Reservas (Lógica de tus compañeros integrada aquí)
        const nights = Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24));
        const servicesLimit = selectedServices?.reduce((acc, curr) => acc + curr.price, 0) || 0;

        const reservationPromises = selectedRooms.map(async (room, index) => {
            const isFirstRoom = index === 0;
            const roomBaseTotal = room.price * nights;
            const baseTotal = isFirstRoom ? (roomBaseTotal + servicesLimit) : roomBaseTotal;
            const discountFactor = paymentData.discount ? (1 - paymentData.discount / 100) : 1;
            const finalTotal = Math.round(baseTotal * discountFactor);


            // Calcular IVA
            const { price_net, iva_amount } = getPriceBreakdown(finalTotal);
            // Código dinámico y conteo real de huéspedes
            const dynamicCode = index === 0 ? reservationCode : `${reservationCode}-${index}`;
            const guestsCount = Object.keys(params.guests).length > 0 && params.guests[room.id]
                ? params.guests[room.id].filter(g => g.firstName && g.lastName).length || 1
                : 1;

            const { data: reservation, error } = await supabase.from("reservations").insert({
                room_id: room.id,
                huesped_titular_id: guestId,
                created_by: user?.id,
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
                reservation_code: dynamicCode, // Usamos el código dinámico
                num_guests: guestsCount,       // Usamos el conteo real
            }).select("id").single();

            if (error) throw new Error(error.message);

            if (isFirstRoom && selectedServices && selectedServices.length > 0 && reservation) {
                const serviceInserts = selectedServices.map(s => ({
                    reservation_id: reservation.id, service_id: s.id, unit_price: s.price, quantity: 1
                }));
                await supabase.from("reservation_services").insert(serviceInserts);
            }

            // Guardar huéspedes en la tabla intermedia
            if (reservation) {
                try {
                    const roomGuests = params.guests[room.id] || [];
                    const guestInserts = [];

                    // Insertar el huésped titular primero
                    guestInserts.push({
                        reservation_id: reservation.id,
                        guest_id: guestId,
                        rol: 'Titular'
                    });

                    // Insertar los acompañantes
                    for (const guest of roomGuests) {
                        if (guest.firstName && guest.lastName && !guest.isResponsible) {
                            // Buscar o crear el huésped acompañante
                            const { data: existingAccGuest } = await supabase
                                .from("guests")
                                .select("id")
                                .eq("tipo_documento", guest.documentType)
                                .eq("numero_documento", guest.documentNumber)
                                .single();

                            let accGuestId = existingAccGuest?.id;

                            if (!accGuestId) {
                                const { data: newAccGuest, error: createError } = await supabase
                                    .from("guests")
                                    .insert({
                                        tipo_documento: guest.documentType,
                                        numero_documento: guest.documentNumber,
                                        nombre: guest.firstName,
                                        apellido: guest.lastName,
                                        pais_origen: guest.country,
                                        ciudad: guest.city,
                                        fecha_nacimiento: guest.birthDate ? new Date(guest.birthDate) : null,
                                        email: guest.email,
                                        telefono: guest.phone,
                                    })
                                    .select("id")
                                    .single();

                                if (createError) {
                                    console.error("Error creating accompanying guest:", createError);
                                } else {
                                    accGuestId = newAccGuest?.id;
                                }
                            }

                            if (accGuestId) {
                                guestInserts.push({
                                    reservation_id: reservation.id,
                                    guest_id: accGuestId,
                                    rol: 'Acompañante'
                                });
                            }
                        }
                    }

                    // Insertar todos los huéspedes en la tabla intermedia
                    if (guestInserts.length > 0) {
                        const { error: insertError } = await supabase
                            .from("reservation_guests_intermedia")
                            .insert(guestInserts);

                        if (insertError) {
                            console.error("Error inserting guests into intermedia table:", insertError);
                        } else {
                            console.log(`Inserted ${guestInserts.length} guests for reservation ${reservation.id}`);
                        }
                    }
                } catch (guestError) {
                    console.error("Error processing guests for reservation:", guestError);
                }
            }

            return { data: reservation };
        });

        const results = await Promise.all(reservationPromises);
        const firstReservationId = results[0]?.data?.id;
>>>>>>> eab6217484b48093428b6d0039c51b3e208e30ec

        revalidatePath("/protected/reservas");

        // --- EMAIL NOTIFICATION LOGIC (Controller Concern) ---
        try {
            // Fetch room details for email (Could be moved to RoomRepository if we want valid Clean Arch, relying on Service return for now)
            const roomIds = selectedRooms.map(r => r.id);
            const { data: roomInfos } = await supabase
                .from("rooms")
                .select("id, number, type")
                .in("id", roomIds);

            const roomDetailsForEmail = roomInfos?.map(r => `Habitación ${r.number} (${r.type || 'Standard'})`) || [];

            const subtotalRooms = selectedRooms.reduce((sum, r) => sum + (r.price * nights), 0);
            const subtotalServices = selectedServices?.reduce((sum, s) => sum + s.price, 0) || 0;
            const totalBeforeDiscount = subtotalRooms + subtotalServices;
            const discountAmount = Math.round(totalBeforeDiscount - paymentData.total);
            const { price_net, iva_amount } = getPriceBreakdown(paymentData.total);

            let emailServices: { name: string; price: number }[] = [];
            if (selectedServices && selectedServices.length > 0) {
                emailServices = selectedServices.map(s => ({
                    name: s.service || `Servicio ${s.id}`,
                    price: s.price
                }));
            }

            // 1. Guest Email
            const guestEmailPromise = sendReservationEmail({
                to: responsibleGuest.email,
                reservationCode: reservationCode,
                guestName: `${responsibleGuest.firstName} ${responsibleGuest.lastName}`,
                checkIn: dateRange.from,
                checkOut: dateRange.to,
                nights: nights,
                roomDetails: roomDetailsForEmail,
                totalAmount: paymentData.total,
                paymentType: paymentData.type,
                guestCount: Object.values(params.guests).reduce((acc, list) => acc + list.filter(g => g.firstName).length, 0),
                subtotalRooms: subtotalRooms,
                subtotalServices: subtotalServices,
                services: emailServices,
                discountAmount: discountAmount,
                totalNet: price_net,
                totalTax: iva_amount,
                amountPaid: paymentData.type === 'full' ? paymentData.total : paymentData.deposit,
                amountPending: paymentData.type === 'full' ? 0 : (paymentData.total - paymentData.deposit),
            });

            // 2. Admin Email
            const adminEmailPromise = sendReservationEmail({
                to: "duermebien57@gmail.com",
                reservationCode: reservationCode,
                guestName: "Administrador",
                checkIn: dateRange.from,
                checkOut: dateRange.to,
                nights: nights,
                roomDetails: roomDetailsForEmail,
                totalAmount: paymentData.total,
                paymentType: paymentData.type,
                guestCount: Object.values(params.guests).reduce((acc, list) => acc + list.filter(g => g.firstName).length, 0),
                subtotalRooms: subtotalRooms,
                subtotalServices: subtotalServices,
                services: emailServices,
                discountAmount: discountAmount,
                totalNet: price_net,
                totalTax: iva_amount,
                amountPaid: paymentData.type === 'full' ? paymentData.total : paymentData.deposit,
                amountPending: paymentData.type === 'full' ? 0 : (paymentData.total - paymentData.deposit),
                emailTitle: "Nueva Reserva Realizada",
                emailIntro: `Se ha generado una nueva reserva por <strong>${responsibleGuest.firstName} ${responsibleGuest.lastName}</strong>. Aquí están los detalles:`
            });

            await Promise.allSettled([guestEmailPromise, adminEmailPromise]);

        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
        }

        return { success: true, data: { id: reservationId } };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}

// --- 2. OBTENER RESERVAS (MANTENEMOS TU VERSIÓN ARREGLADA) ---
export async function getReservations(query?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("reservations")
            .select(`
                id,
                check_in,
                check_out,
                status,
                payment_status,
                total,
                reservation_code,
                deposit_amount,
                cantidad_noches,
                guests!huesped_titular_id (
                    nombre, 
                    apellido, 
                    email, 
                    telefono,
                    pais_origen  
                ),
                rooms!room_id (number, type)
            `)
            .order("created_at", { ascending: false });

        if (error) { console.error("Error fetching reservations:", error.message); return []; }

        if (query) {
            const lowerQuery = query.toLowerCase();
            return data.filter((res) => {
                // TU ARREGLO DE ARRAY VS OBJETO (Vital para que no falle)
                const guest = Array.isArray(res.guests) ? res.guests[0] : res.guests;
                const room = Array.isArray(res.rooms) ? res.rooms[0] : res.rooms;

                const guestName = guest?.nombre?.toLowerCase() || "";
                const guestLastName = guest?.apellido?.toLowerCase() || "";
                const roomNum = room?.number?.toLowerCase() || "";
                const code = res.reservation_code?.toLowerCase() || "";

                return guestName.includes(lowerQuery) ||
                    guestLastName.includes(lowerQuery) ||
                    roomNum.includes(lowerQuery) ||
                    code.includes(lowerQuery);
            });
        }
        return data;
    } catch (err) { console.error(err); return []; }
}

// --- 3. OBTENER POR ID ---
export async function getReservationById(id: string) {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from("reservations")
            .select(`
                *,
                created_at,
                final_payment_at,
                actual_check_in,
                actual_check_out,
                guests!huesped_titular_id(*),
                rooms!room_id(*),
                creator: profiles!created_by(full_name),
                reservation_services(quantity, unit_price, services(service)),
                reservation_guests_intermedia(
                    id,
                    rol,
                    guests(
                        id,
                        nombre,
                        apellido,
                        tipo_documento,
                        numero_documento,
                        email,
                        telefono,
                        pais_origen,
                        ciudad,
                        fecha_nacimiento
                    )
                )
            `)
            .eq("id", id)
            .single();
        if (error) return null;
        return data;
    } catch { return null; }
}

// --- 4. CANCELAR RESERVA ---
// --- 4. CANCELAR RESERVA ---
export async function cancelReservation(reservationId: string) {
    const supabase = await createClient();

    const guestRepo = new GuestRepository(supabase);
    const reservationRepo = new ReservationRepository(supabase);
    const roomRepo = new RoomRepository(supabase);
    const reservationService = new ReservationService(guestRepo, reservationRepo, roomRepo);

    try {
        // 1. Delegate Logic to Service
        const { reservation, newPaymentStatus } = await reservationService.cancelReservation(reservationId);

        // 2. Email Logic (Controller Concern)
        if (reservation) {
            try {
                const guest = Array.isArray(reservation.guests) ? reservation.guests[0] : reservation.guests;
                const room = Array.isArray(reservation.rooms) ? reservation.rooms[0] : reservation.rooms;

                const guestName = `${guest?.nombre} ${guest?.apellido}`;
                const roomDetails = [`Habitación ${room?.number} (${room?.type || 'Standard'})`];

                // Recalcular desgloses básicos para el correo
                const subtotalRooms = (room?.price_base || 0) * reservation.cantidad_noches;
                const subtotalServices = reservation.reservation_services?.reduce((acc: number, curr: { quantity: number; unit_price: number }) => acc + (curr.quantity * curr.unit_price), 0) || 0;
                const totalNet = Math.round(reservation.total / 1.19);
                const totalTax = reservation.total - totalNet;

                // Formatear servicios
                const emailServices = reservation.reservation_services?.map((s: { quantity: number; unit_price: number; services: { service: string } | { service: string }[] | null }) => {
                    const serviceName = Array.isArray(s.services) ? s.services[0]?.service : s.services?.service;
                    return {
                        name: serviceName || "Servicio",
                        price: s.unit_price * s.quantity
                    };
                }) || [];

                const emailParams = {
                    to: guest?.email || "",
                    reservationCode: reservation.reservation_code || "N/A",
                    guestName: guestName,
                    checkIn: reservation.check_in,
                    checkOut: reservation.check_out,
                    nights: reservation.cantidad_noches,
                    roomDetails: roomDetails,
                    totalAmount: reservation.total,
                    paymentType: (reservation.payment_status === 'paid' ? 'full' : 'partial') as 'full' | 'partial',
                    guestCount: reservation.num_guests || 1,
                    subtotalRooms: subtotalRooms,
                    subtotalServices: subtotalServices,
                    services: emailServices,
                    discountAmount: 0,
                    totalNet: totalNet,
                    totalTax: totalTax,
                    amountPaid: reservation.deposit_amount || 0,
                    amountPending: reservation.total - (reservation.deposit_amount || 0),
                    status: 'Cancelada',
                    paymentStatus: newPaymentStatus
                };

                // Correo Huésped
                const guestEmailPromise = sendReservationEmail({
                    ...emailParams,
                    to: guest?.email || "",
                    emailTitle: "Reserva Cancelada",
                    emailIntro: `Hola <strong>${guestName}</strong>, tu reserva ha sido cancelada correctamente.`
                });

                // Correo Admin
                const adminEmailPromise = sendReservationEmail({
                    ...emailParams,
                    to: "duermebien57@gmail.com",
                    emailTitle: "Reserva Cancelada (Admin)",
                    emailIntro: `La reserva de <strong>${guestName}</strong> ha sido cancelada.`
                });

                await Promise.allSettled([guestEmailPromise, adminEmailPromise]);
            } catch (emailError) {
                console.error("Error enviando correos de cancelación:", emailError);
            }
        }

        revalidatePath("/protected/reservas");
        revalidatePath("/protected/habitaciones");
        return { success: true };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}

// --- 5. FINALIZAR PAGO ---
// --- 5. FINALIZAR PAGO ---
export async function finalizeReservationPayment(reservationId: string) {
    const supabase = await createClient();

    const guestRepo = new GuestRepository(supabase);
    const reservationRepo = new ReservationRepository(supabase);
    const roomRepo = new RoomRepository(supabase);
    const reservationService = new ReservationService(guestRepo, reservationRepo, roomRepo);

    try {
        await reservationService.finalizePayment(reservationId);
        revalidatePath("/protected/reservas");
        return { success: true };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}

// --- 6. MARCAR REEMBOLSO ---
export async function markReservationRefunded(reservationId: string, amount: number) {
    const supabase = await createClient();

    const guestRepo = new GuestRepository(supabase);
    const reservationRepo = new ReservationRepository(supabase);
    const roomRepo = new RoomRepository(supabase);
    const reservationService = new ReservationService(guestRepo, reservationRepo, roomRepo);

    try {
        await reservationService.markRefunded(reservationId, amount);
        revalidatePath("/protected/reservas");
        return { success: true };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
    }
}

// --- 7. RESERVA ACTIVA ---
// --- 7. RESERVA ACTIVA ---
export async function getActiveReservationByRoomId(roomId: string) {
    const supabase = await createClient();

    const reservationRepo = new ReservationRepository(supabase);

    try {
        const activeReservation = await reservationRepo.findActiveByRoomId(roomId);
        return activeReservation;
    } catch (error) {
        console.error("Error buscando reserva activa:", error, "roomId:", roomId);
        return null;
    }
}