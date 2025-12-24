/**
 * Tipos de respuestas API
 * 
 * Este archivo contiene los tipos para las respuestas
 * de server actions y funciones API.
 */

// ==================== SERVER ACTION RESULTS ====================

export interface ServerErrorResult {
    success: false;
    error: string;
}

export interface ServerSuccessResult<T = unknown> {
    success: true;
    data?: T;
    message?: string;
    password?: string; // Para createUser que retorna contraseña generada
}

export type ServerActionResult<T = unknown> = ServerSuccessResult<T> | ServerErrorResult;

// ==================== WHATSAPP ====================

export interface WhatsAppMessageResult {
    success: boolean;
    sid?: string;
    error?: string;
}

export interface IncidentAnalysisResult {
    success: boolean;
    data?: {
        department: string;
        urgency: string;
        sentiment: string;
        summary: string;
    };
    error?: string;
}
