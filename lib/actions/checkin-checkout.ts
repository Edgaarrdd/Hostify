"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
<<<<<<< HEAD
import { sendSmartWelcome } from "@/lib/actions/ai-concierge";
import { ReservationRepository } from "@/lib/repositories/reservation.repository";
import { GuestRepository } from "@/lib/repositories/guest.repository";
import { RoomRepository } from "@/lib/repositories/room.repository";
import { ReservationService } from "@/lib/services/reservation.service";
=======
import { sendSmartWelcome } from "@/lib/services/whatsapp/ai-concierge"; // <--- IMPORTAMOS LA IA
>>>>>>> eab6217484b48093428b6d0039c51b3e208e30ec

export type CheckInResult = {
    success: boolean;
    message: string;
};

// Helper function to create supabase client with cookies
async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

/**
 * Realiza el proceso de Check-in para una reserva específica.
 */
export async function performCheckIn(reservationId: string): Promise<CheckInResult> {
    const supabase = await createClient(); // Use local helper or import from lib/supabase/server

    // Instantiate Dependencies
    const guestRepo = new GuestRepository(supabase);
    const reservationRepo = new ReservationRepository(supabase);
    const roomRepo = new RoomRepository(supabase);
    const reservationService = new ReservationService(guestRepo, reservationRepo, roomRepo);

    try {
        // 1. Logic via Service
        const { reservation } = await reservationService.performCheckIn(reservationId);

        // 2. AI Concierge (Controller Concern)
        const { data: guest, error: guestError } = await supabase
            .from("guests")
            .select("nombre, telefono, pais_origen")
            .eq("id", reservation.huesped_titular_id)
            .single();

        if (guestError) {
            console.error("Error al obtener huésped (no crítico):", guestError);
        } else if (guest && guest.telefono) {
            // Se asume "Chile" si no hay país registrado para evitar error
            // Need to fetch room number as well, simpler to re-fetch or trust passed data?
            // Reservation from service might be sparse or typed as DB. 
            // Let's fetch strict check for AI to keep it safe or use what we have if available.

            // Note: reservation variable from service is returning type "ReservationDB" (or Joined if adjusted).
            // But we need 'rooms.number'.

            // To be safe and quick, let's fetch strictly for the AI call or use the roomRepo to get number.
            const room = await roomRepo.findById(reservation.room_id);

            sendSmartWelcome(
                guest.nombre,
                room?.number || "N/A",
                guest.telefono,
                guest.pais_origen || "Chile"
            ).catch(err => {
                console.error("Error al enviar mensaje de bienvenida (no crítico):", err);
            });
        }

        revalidatePath("/protected/reservas");
        revalidatePath(`/protected/reservas/${reservationId}`);

        return { success: true, message: "Check-in realizado con éxito" };

    } catch (error: unknown) {
        console.error("Error en Check-in:", error);
        const message = error instanceof Error ? error.message : "Error";
        return { success: false, message };
    }
}

/**
 * Realiza el proceso de Check-out para finalizar una estadía.
 */
export async function performCheckOut(reservationId: string): Promise<CheckInResult> {
    const supabase = await createClient();

    // Instantiate Dependencies
    const guestRepo = new GuestRepository(supabase);
    const reservationRepo = new ReservationRepository(supabase);
    const roomRepo = new RoomRepository(supabase);
    const reservationService = new ReservationService(guestRepo, reservationRepo, roomRepo);

    try {
        await reservationService.performCheckOut(reservationId);

        revalidatePath("/protected/reservas");
        revalidatePath(`/protected/reservas/${reservationId}`);

        return { success: true, message: "Check-out realizado con éxito" };

    } catch (error: unknown) {
        console.error("Error en Check-out:", error);
        return { success: false, message: "Error al realizar Check-out" };
    }
}