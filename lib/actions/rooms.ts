"use server";

import { createClient } from "@/lib/supabase/server";

export type RoomType = "simple" | "doble";

// Interfaz simulada para Room para coincidir con BD
export interface Room {
    id: string;
    number: string;
    type: RoomType;
    capacity: number;
    price_base: number;
    status?: string;
}
/**
 * Busca habitaciones disponibles para un rango de fechas.
 * Excluye aquellas habitaciones que ya tienen reservas confirmadas o check-ins activos en ese período.
 * 
 * @param from - Fecha de inicio deseada.
 * @param to - Fecha de fin deseada.
 * @returns Lista de habitaciones disponibles con información básica y precio.
 */
export async function getAvailableRooms(from: Date, to: Date): Promise<Room[]> {
    const supabase = await createClient();

    try {
        const fromDate = from.toISOString().split("T")[0];
        const toDate = to.toISOString().split("T")[0];

        // 1. Obtener todas las habitaciones
        // Intentamos seleccionar 'price_base'.
        const { data: rooms, error: roomsError } = await supabase
            .from("rooms")
            .select("id, number, type, capacity, price_base, status");

        if (roomsError) {
            console.error("Error fetching rooms:", roomsError);
            throw new Error(roomsError.message);
        }

        if (!rooms) return [];

        // 2. Obtener reservas que se solapan con las fechas seleccionadas
        const { data: reservations, error: reservationsError } = await supabase
            .from("reservations")
            .select("room_id")
            .not("status", "in", '("Cancelada","Finalizada")') // Ignorar canceladas y finalizadas
            .or(`and(check_in.lte.${toDate},check_out.gte.${fromDate})`); // Lógica de solapamiento

        if (reservationsError) {
            console.error("Error fetching reservations:", reservationsError);
            throw new Error(reservationsError.message);
        }

        const occupiedRoomIds = new Set(reservations?.map((r) => r.room_id));

        // 3. Filtrar habitaciones
        const availableRooms = rooms.filter((room) => !occupiedRoomIds.has(room.id));

        // Mapear para asegurar tipo
        return availableRooms.map(r => ({
            id: r.id,
            number: r.number,
            type: r.type as RoomType,
            capacity: r.capacity || 2, // Capacidad predeterminada si falta
            price_base: r.price_base || 0,       // Precio predeterminado si falta
            status: r.status
        }));

    } catch (err) {
        console.error("Server Action getAvailableRooms error:", err);
        return [];
    }
}
