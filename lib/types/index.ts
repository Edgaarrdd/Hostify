/**
 * Punto de entrada centralizado para todos los tipos
 * 
 * Re-exporta todos los tipos desde un solo lugar para
 * facilitar los imports.
 */

// Models
export type {
    User,
    UserProfile,
    Guest,
    Room,
    Reservation,
    ActiveReservation,
    Service,
    Stay,
    DashboardData,
} from './models';

// Forms
export type {
    GuestFormData,
    RoomFormData,
    CreateReservationParams,
} from './forms';

// API
export type {
    ServerErrorResult,
    ServerSuccessResult,
    ServerActionResult,
    WhatsAppMessageResult,
    IncidentAnalysisResult,
} from './api';
