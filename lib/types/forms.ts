/**
 * Tipos de formularios
 * 
 * Este archivo contiene las interfaces de datos
 * para formularios de la aplicación.
 */

// ==================== GUEST FORM ====================

export interface GuestFormData {
    tipo_documento: string;
    numero_documento: string;
    nombre: string;
    apellido: string;
    pais_origen: string;
    ciudad: string;
    fecha_nacimiento: string;
    email: string;
    telefono: string;
}

// ==================== ROOM FORM ====================

export interface RoomFormData {
    number: string;
    type: string;
    capacity: string;
    price_base: string;
    status: string;
}

// ==================== OFFER FORM ====================

export interface OfferFormData {
    title: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
    code: string;
    status: 'active' | 'inactive';
}

// ==================== RESERVATION FORM ====================

export interface CreateReservationParams {
    guests: Record<string, GuestFormData[]>;
    responsibleGuest: GuestFormData;
    selectedRooms: { id: string; price: number }[];
    dateRange: { from: Date | string; to: Date | string };
    paymentData: {
        type: 'partial' | 'full';
        amount: number;
        deposit: number;
        total: number;
        discount?: number;
    };
    reservationCode: string;
    selectedServices?: { id: number; price: number; service?: string }[];
}
