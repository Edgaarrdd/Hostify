
import { SupabaseClient } from "@supabase/supabase-js";

export interface ReservationDB {
    id: string;
    room_id: string;
    huesped_titular_id: string;
    created_by?: string;
    check_in: string | Date;
    check_out: string | Date;
    cantidad_noches: number;
    total: number;
    subtotal: number;
    iva_amount: number;
    status: string;
    deposit_amount: number;
    payment_status: string;
    payment_type: string;
    reservation_code: string;
    num_guests: number;
    created_at?: string;
    final_payment_at?: string | Date;
    actual_check_in?: string | Date;
    actual_check_out?: string | Date;
    refund_amount?: number;
}

export type CreateReservationDB = Omit<ReservationDB, "id" | "created_at">;

export interface ReservationServiceDB {
    reservation_id: string;
    service_id: number;
    unit_price: number;
    quantity: number;
}

export interface JoinedReservation extends ReservationDB {
    guests: { nombre: string; apellido: string; email: string } | { nombre: string; apellido: string; email: string }[];
    rooms: { number: string; type: string; price_base: number } | { number: string; type: string; price_base: number }[];
    reservation_services: { quantity: number; unit_price: number; services: { service: string } | { service: string }[] | null }[];
}

export class ReservationRepository {
    constructor(private supabase: SupabaseClient) { }

    async create(data: CreateReservationDB): Promise<ReservationDB> {
        const { data: reservation, error } = await this.supabase
            .from("reservations")
            .insert(data)
            .select("*")
            .single();

        if (error) throw new Error(`Error creating reservation: ${error.message}`);
        return reservation;
    }

    async addServices(services: ReservationServiceDB[]): Promise<void> {
        if (services.length === 0) return;

        const { error } = await this.supabase
            .from("reservation_services")
            .insert(services);

        if (error) throw new Error(`Error adding services to reservation: ${error.message}`);
    }

    async findById(id: string): Promise<JoinedReservation | null> {
        // Intentionally using broad select similar to original code for compatibility
        const { data, error } = await this.supabase
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
            reservation_services(quantity, unit_price, services(service))
        `)
            .eq("id", id)
            .single();
        if (error) return null;
        return data as unknown as JoinedReservation;
    }

    async findByGuestId(guestId: string): Promise<ReservationDB[]> {
        const { data, error } = await this.supabase
            .from("reservations")
            .select(
                `id, reservation_code, check_in, check_out, cantidad_noches, total, 
         payment_status, status, deposit_amount, room_id, created_by, huesped_titular_id, subtotal, iva_amount, payment_type, num_guests`
            )
            .eq("huesped_titular_id", guestId)
            .order("check_in", { ascending: false });

        if (error) throw new Error(`Error fetching guest reservations: ${error.message}`);
        return (data as unknown as ReservationDB[]) || [];
    }

    async update(id: string, data: Partial<ReservationDB>): Promise<ReservationDB> {
        const { data: updatedReservation, error } = await this.supabase
            .from("reservations")
            .update(data)
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw new Error(`Error updating reservation: ${error.message}`);
        return updatedReservation;
    }

    async findActiveByRoomId(roomId: string): Promise<ReservationDB | null> {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await this.supabase
            .from("reservations")
            .select("*")
            .eq("room_id", roomId)
            .not("status", "in", '("Cancelada","Finalizada")')
            .lte("check_in", today)
            .gte("check_out", today)
            .order("status", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(`Error finding active reservation: ${error.message}`);
        return data;
    }
}
