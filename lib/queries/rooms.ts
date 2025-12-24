"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Tipos de datos para habitaciones
 */
export interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  status: string | null;
  price_base: number | null;
  check_in?: string | null; // Fecha de check-in si está ocupada
  check_out?: string | null; // Fecha de check-out si está ocupada
}

/**
 * Obtiene todas las habitaciones y sus estados.
 * Incluye información de reservas activas para determinar check-in/out.
 */
export async function fetchRooms(): Promise<Room[]> {
  const supabase = await createClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select(`
        id,
        number,
        type,
        capacity,
        status,
        price_base,
        reservations(
          check_in,
          check_out,
          status
        )
      `)
      .order("number");

    if (roomsError) {
      throw new Error(`Error al obtener habitaciones: ${roomsError.message}`);
    }

    const rooms: Room[] = (roomsData || []).map((room: { id: string; number: string; type: string; capacity: number; status: string | null; price_base: number | null; reservations?: Array<{ check_in: string; check_out: string; status: string }> }) => {
      // Buscar reserva activa (Ocupada o Check-in, abarcando hoy)
      const activeReservation = room.reservations?.find(
        (res) =>
          (res.status === "Ocupada" || res.status === "Check-in") &&
          res.check_in <= today &&
          res.check_out >= today
      );

      return {
        id: room.id,
        number: room.number,
        type: room.type,
        capacity: room.capacity,
        status: room.status,
        price_base: room.price_base, // Usar columna del backend
        check_in: activeReservation ? activeReservation.check_in : null,
        check_out: activeReservation ? activeReservation.check_out : null,
      };
    });

    return rooms;
  } catch (error: unknown) {
    console.error("Error en fetchRooms:", error);
    throw error;
  }
}

/**
 * Busca una habitación por su ID.
 * @param id ID de la habitación
 */
export async function fetchRoomById(id: string): Promise<Room | null> {
  const supabase = await createClient();

  try {
    const { data: room, error } = await supabase
      .from("rooms")
      .select("id, number, type, capacity, status, price_base")
      .eq("id", id)
      .single();

    if (error) {
      console.log("Error fetching room:", error.message);
      return null;
    }

    return room as Room;
  } catch (error: unknown) {
    console.error("Error en fetchRoomById:", error);
    return null;
  }
}

/**
 * Busca habitaciones por número o tipo.
 * @param query Texto de búsqueda
 */
export async function searchRooms(query: string): Promise<Room[]> {
  const supabase = await createClient();

  try {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("id, number, type, capacity, status, price_base")
      .or(`number.ilike.%${query}%,type.ilike.%${query}%`)
      .order("number");

    if (error) {
      throw new Error(`Error al buscar habitaciones: ${error.message}`);
    }

    return rooms as Room[];
  } catch (error: unknown) {
    console.error("Error en searchRooms:", error);
    return [];
  }
}

/**
 * Crea una nueva habitación.
 * @param data Datos de la habitación
 */
export async function createRoom(data: Omit<Room, "id" | "check_in" | "check_out">) {
  const supabase = await createClient();

  try {
    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({
        number: data.number,
        type: data.type,
        capacity: data.capacity,
        price_base: data.price_base,
        status: data.status || "Disponible",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/protected/habitaciones");
    return newRoom;
  } catch (error: unknown) {
    console.error("Error al crear habitación:", error);
    throw error;
  }
}

/**
 * Actualiza los datos de una habitación.
 * @param id ID de la habitación
 * @param data Datos a actualizar
 */
export async function updateRoom(id: string, data: Partial<Omit<Room, "id" | "check_in" | "check_out">>) {
  const supabase = await createClient();

  try {
    const updateData: typeof data = { ...data };

    // Asegurar que enviamos los nombres de columna correctos
    if (data.price_base !== undefined) {
      updateData.price_base = data.price_base;
    }

    const { data: updatedRoom, error } = await supabase
      .from("rooms")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/protected/habitaciones");
    revalidatePath(`/protected/habitaciones/${id}`);
    return updatedRoom;
  } catch (error: unknown) {
    console.error("Error al actualizar habitación:", error);
    throw error;
  }
}

/**
 * Obtiene el conteo de reservas para una habitación.
 * Útil para validaciones antes de eliminar.
 */
export async function getReservationCountByRoomId(id: string): Promise<number> {
  const supabase = await createClient();

  try {
    const { count, error } = await supabase
      .from("reservations")
      .select("*", { count: 'exact', head: true })
      .eq("room_id", id);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error: unknown) {
    console.error("Error fetching reservation count:", error);
    return 0;
  }
}

/**
 * Elimina una habitación.
 * @param id ID de la habitación
 */
export async function deleteRoom(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/protected/habitaciones");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar habitación:", error);
    throw error;
  }
}
