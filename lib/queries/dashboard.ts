"use server";

import { createClient } from "@/lib/supabase/server";
import type { Room, Stay, ActiveReservation } from "@/lib/types";

/**
 * Tipos de datos para el dashboard
 */
export interface DashboardData {
  rooms: Room[];
  stays: Stay[];
  activeReservations: ActiveReservation[];
}

/**
 * Obtiene los datos del dashboard: habitaciones y huéspedes actuales
 * Basado en las tablas: rooms, reservations, guests
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  try {
    // 1. Obtener todas las habitaciones
    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select("id, number, type, status");

    if (roomsError) {
      throw new Error(`Error al obtener habitaciones: ${roomsError.message}`);
    }

    // Mapear los datos a la interfaz Room
    const rooms: Room[] = (roomsData || []).map((room) => ({
      id: room.id || "",
      number: room.number || "",
      type: room.type || "",
      status: room.status || "Disponible",
    }));

    // Ordenar habitaciones: primero disponibles, luego ocupadas, y dentro de cada grupo por número
    rooms.sort((a, b) => {
      const statusA = a.status?.toLowerCase() || "";
      const statusB = b.status?.toLowerCase() || "";

      // Si tienen diferente estado, disponibles van primero
      if (statusA !== statusB) {
        if (statusA === "disponible") return -1;
        if (statusB === "disponible") return 1;
      }

      // Si tienen el mismo estado, ordenar por número de habitación
      const numA = parseInt(a.number, 10) || 0;
      const numB = parseInt(b.number, 10) || 0;
      return numA - numB;
    });

    // 2. Obtener huéspedes alojados actualmente
    const today = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD

    // Obtener todas las reservaciones activas
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, check_in, check_out, huesped_titular_id, room_id, status, reservation_code, total, payment_status, deposit_amount")
      .lte("check_in", today)
      .gte("check_out", today)
      .not("status", "in", '("Cancelada","Finalizada")'); // Excluir reservas finalizadas y canceladas

    if (reservationsError) {
      console.error("Error al obtener reservations:", reservationsError);
    }

    const stays: Stay[] = [];

    if (reservationsData && reservationsData.length > 0) {

      // Obtener IDs únicos de guests y rooms
      const titularIds = [
        ...new Set(reservationsData.map(r => r.huesped_titular_id))
      ];

      const roomIds = [
        ...new Set(reservationsData.map(r => r.room_id))
      ];

      const reservationIds = [
        ...new Set(reservationsData.map(r => r.id))
      ];

      // Obtener datos de guests (titulares) - Nueva estructura con nombre y apellido
      const titularesMap: { [key: string]: string } = {};

      const { data: titularesData } = await supabase
        .from("guests")
        .select("id, nombre, apellido")
        .in("id", titularIds);

      if (titularesData) {
        titularesData.forEach((g) => {
          titularesMap[g.id] = `${g.nombre} ${g.apellido}`.trim();
        });
      }

      // Contar acompañantes de cada reserva - Usar tabla reservation_guests_intermedia
      // NOTA: Los acompañantes NO incluyen al titular, solo los pasajeros adicionales
      const accompantsCountMap: { [key: string]: number } = {};

      if (reservationIds.length > 0) {
        const { data: acompData, error: acompError } = await supabase
          .from("reservation_guests_intermedia")
          .select("reservation_id, guest_id")
          .in("reservation_id", reservationIds);

        if (acompError) {
          console.error("Error al obtener acompañantes:", acompError);
        } else if (acompData) {
          acompData.forEach((row) => {
            accompantsCountMap[row.reservation_id] =
              (accompantsCountMap[row.reservation_id] || 0) + 1;
          });
        }
      }

      // Obtener datos de rooms
      const roomsMap: { [key: string]: string } = {};
      if (roomIds.length > 0) {
        const { data: roomsData2, error: roomsError2 } = await supabase
          .from("rooms")
          .select("id, number")
          .in("id", roomIds);

        if (roomsError2) {
          console.error("Error al obtener rooms:", roomsError2);
        } else if (roomsData2) {
          roomsData2.forEach((room) => {
            roomsMap[room.id] = room.number;
          });
        }
      }

      // Combinar todos los datos
      reservationsData.forEach((reservation) => {
        // guestCount = 1 (titular) + N (acompañantes en la tabla intermedia)
        const totalGuests = 1 + (accompantsCountMap[reservation.id] || 0);

        stays.push({
          id: reservation.id || "",
          guest_name: titularesMap[reservation.huesped_titular_id] || "Desconocido",
          room_number: roomsMap[reservation.room_id] || "",
          check_in: formatDate(reservation.check_in),
          check_out: formatDate(reservation.check_out),
        });
      });


      // 2.1 Actualizar habitaciones con ID de reserva actual si están ocupadas
      const roomReservationMap: { [key: string]: string } = {};
      reservationsData.forEach(r => {
        if (r.status === "Confirmada" || r.status === "Check-in") {
          roomReservationMap[r.room_id] = r.id;
        }
      });

      rooms.forEach(room => {
        if (roomReservationMap[room.id]) {
          room.currentReservationId = roomReservationMap[room.id];
        }
      });
    }

    // 3. Obtener reservas activas con todos los detalles para la tabla del dashboard
    const activeReservationsData: ActiveReservation[] = [];

    if (reservationsData && reservationsData.length > 0) {
      const titularIds = [
        ...new Set(reservationsData.map(r => r.huesped_titular_id))
      ];

      const roomIds = [
        ...new Set(reservationsData.map(r => r.room_id))
      ];

      // Obtener datos de guests
      const titularesDetailsMap: { [key: string]: { nombre: string; apellido: string; numero_documento: string } } = {};
      if (titularIds.length > 0) {
        const { data: titularesDetailsData } = await supabase
          .from("guests")
          .select("id, nombre, apellido, numero_documento")
          .in("id", titularIds);

        if (titularesDetailsData) {
          titularesDetailsData.forEach((g) => {
            titularesDetailsMap[g.id] = {
              nombre: g.nombre,
              apellido: g.apellido,
              numero_documento: g.numero_documento,
            };
          });
        }
      }

      // Obtener datos de rooms con todos los detalles
      const roomsDetailsMap: { [key: string]: { number: string; type: string } } = {};
      if (roomIds.length > 0) {
        const { data: roomsDetailsData } = await supabase
          .from("rooms")
          .select("id, number, type")
          .in("id", roomIds);

        if (roomsDetailsData) {
          roomsDetailsData.forEach((room) => {
            roomsDetailsMap[room.id] = {
              number: room.number,
              type: room.type,
            };
          });
        }
      }

      // Construir las reservas activas
      reservationsData.forEach((reservation) => {
        // Filtramos para mostrar reservas activas (Confirmada o Pendiente), excluyendo Canceladas y Finalizadas
        if (reservation.status === "Cancelada" || reservation.status === "Finalizada") {
          return;
        }

        const titular = titularesDetailsMap[reservation.huesped_titular_id];
        const room = roomsDetailsMap[reservation.room_id];

        activeReservationsData.push({
          id: reservation.id,
          reservation_code: reservation.reservation_code || null,
          titular_name: titular ? `${titular.nombre} ${titular.apellido}` : "Desconocido",
          titular_rut: titular?.numero_documento || "",
          room_number: room?.number || "",
          room_type: room?.type || "",
          check_in: formatDate(reservation.check_in),
          check_out: formatDate(reservation.check_out),
          total: reservation.total || 0,
          payment_status: reservation.payment_status || "pending",
          status: reservation.status || "Pendiente",
          deposit_amount: reservation.deposit_amount || null,
        });
      });

      // Ordenar: Primero Confirmada/Pendiente, luego Check-in
      activeReservationsData.sort((a, b) => {
        const getPriority = (status: string) => {
          if (status === "Confirmada" || status === "Pendiente") return 1;
          if (status === "Check-in") return 2;
          return 3;
        };

        const priorityA = getPriority(a.status);
        const priorityB = getPriority(b.status);

        return priorityA - priorityB;
      });
    }

    return {
      rooms,
      stays,
      activeReservations: activeReservationsData,
    };
  } catch (error: unknown) {
    console.error("Error en fetchDashboardData:", error);
    throw error;
  }
}

/**
 * Función auxiliar para formatear fechas
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";

  try {
    // Si ya está en formato YYYY-MM-DD, retornar así
    if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Retorna formato YYYY-MM-DD
  } catch {
    return dateString || "";
  }
}

/**
 * Obtiene estadísticas del dashboard
 */
export async function fetchDashboardStats() {
  const supabase = await createClient();

  try {
    // Total de habitaciones
    const { data: allRooms, error: roomsCountError } = await supabase
      .from("rooms")
      .select("id", { count: "exact" });

    if (roomsCountError) throw roomsCountError;

    // Habitaciones ocupadas (status = 'Ocupada')
    const { data: occupiedRooms, error: occupiedError } = await supabase
      .from("rooms")
      .select("id", { count: "exact" })
      .eq("status", "Ocupada");

    if (occupiedError) throw occupiedError;

    // Habitaciones disponibles (status = 'Disponible')
    const { data: availableRooms, error: availableError } = await supabase
      .from("rooms")
      .select("id", { count: "exact" })
      .eq("status", "Disponible");

    if (availableError) throw availableError;

    // Huéspedes actuales (reservas activas)
    const today = new Date().toISOString().split("T")[0];
    const { data: currentGuests, error: guestsError } = await supabase
      .from("reservations")
      .select("id", { count: "exact" })
      .lte("check_in", today)
      .gte("check_out", today)
      .eq("status", "Confirmada");

    if (guestsError) throw guestsError;

    return {
      totalRooms: allRooms?.length || 0,
      occupiedRooms: occupiedRooms?.length || 0,
      availableRooms: availableRooms?.length || 0,
      currentGuests: currentGuests?.length || 0,
    };
  } catch (error: unknown) {
    console.error("Error en fetchDashboardStats:", error);
    return {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      currentGuests: 0,
    };
  }
}

