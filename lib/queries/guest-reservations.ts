"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";

export interface ReservationByGuest {
  id: string;
  reservation_code: string | null;
  check_in: string;
  check_out: string;
  cantidad_noches: number;
  total: number;
  payment_status: string;
  status: string;
  deposit_amount: number | null;
  rooms: Array<{
    number: string;
    type: string;
  }> | null;
}

/**
 * Obtiene todas las reservas de un huésped por su ID
 */
export async function getGuestReservations(
  guestId: string
): Promise<ReservationByGuest[]> {
  const supabase = await createServerClient();

  try {
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select(
        `id, reservation_code, check_in, check_out, cantidad_noches, total, 
         payment_status, status, deposit_amount, room_id`
      )
      .eq("huesped_titular_id", guestId)
      .order("check_in", { ascending: false });

    if (reservationsError) {
      throw new Error(
        `Error al obtener reservas del huésped: ${reservationsError.message}`
      );
    }

    if (!reservationsData || reservationsData.length === 0) {
      return [];
    }

    // Obtener IDs únicos de rooms
    const roomIds = [
      ...new Set((reservationsData as Array<{ room_id: string }>).map(r => r.room_id).filter(Boolean))
    ];

    // Obtener datos de rooms
    const roomsMap: { [key: string]: { number: string; type: string } } = {};
    if (roomIds.length > 0) {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("id, number, type")
        .in("id", roomIds);

      if (roomsError) {
        console.error("Error al obtener rooms:", roomsError);
      } else if (roomsData) {
        roomsData.forEach((room: { id: string; number: string; type: string }) => {
          roomsMap[room.id] = { number: room.number, type: room.type };
        });
      }
    }

    // Transformar datos: agrupar rooms por reserva
    const result = (reservationsData as Array<{ id: string; reservation_code: string | null; check_in: string; check_out: string; cantidad_noches: number; total: number; payment_status: string; status: string; deposit_amount: number | null; room_id: string }>).map(res => {
      const room = roomsMap[res.room_id];
      return {
        id: res.id,
        reservation_code: res.reservation_code,
        check_in: res.check_in,
        check_out: res.check_out,
        cantidad_noches: res.cantidad_noches,
        total: res.total,
        payment_status: res.payment_status,
        status: res.status,
        deposit_amount: res.deposit_amount,
        rooms: room ? [room] : null,
      };
    });

    return result as ReservationByGuest[];
  } catch (error: unknown) {
    console.error("Error en getGuestReservations:", error);
    throw error;
  }
}
