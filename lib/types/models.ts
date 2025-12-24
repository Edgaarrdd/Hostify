/**
 * Tipos de modelos de dominio
 * 
 * Este archivo contiene las interfaces y tipos principales
 * que representan las entidades del negocio.
 */

// ==================== USER ====================

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'encargado';
    full_name: string | null;
    created_at?: string;
}

export type UserProfile = User;

// ==================== GUEST ====================

export interface Guest {
    id: string;
    tipo_documento: string;
    numero_documento: string;
    nombre: string;
    apellido: string;
    pais_origen: string | null;
    ciudad: string | null;
    fecha_nacimiento: string | null;
    email: string | null;
    telefono: string | null;
    created_at?: string;
}

// ==================== ROOM ====================

export interface Room {
    id: string;
    number: string;
    type: string;
    capacity?: number;
    price_base?: number;
    status: 'Disponible' | 'Ocupada' | string;
    check_in?: string | null;
    check_out?: string | null;
    currentReservationId?: string | null;
}

// ==================== RESERVATION ====================

export interface Reservation {
    id: string;
    reservation_code: string;
    check_in: string;
    check_out: string;
    status: 'Pendiente' | 'Confirmada' | 'Cancelada' | string;
    payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
    total: number;
    deposit_amount?: number | null;
    refund_amount?: number | null;
    created_at?: string;
    created_by?: string;
}

export interface ActiveReservation extends Reservation {
    titular_name: string;
    titular_rut: string;
    room_number: string;
    room_type: string;
    cantidad_noches?: number;
}

// ==================== SERVICE ====================

export interface Service {
    id: number;
    service: string;
    price: number;
    start_time?: string | null;
    end_time?: string | null;
}

// ==================== STAY ====================

export interface Stay {
    id: string;
    guest_name: string;
    room_number: string;
    check_in: string;
    check_out: string;
}

// ==================== OFFERS ====================

export interface Offer {
    id: string;
    title: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
    code: string | null;
    status: 'active' | 'inactive' | 'expired';
    created_at?: string;
}

// ==================== DASHBOARD ====================

export interface DashboardData {
    rooms: Room[];
    stays: Stay[];
    activeReservations: ActiveReservation[];
}
