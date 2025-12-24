/**
 * Utilidades para Manejo Consistente de Errores
 * 
 * Proporciona funciones helper para manejar errores de manera uniforme
 * en todas las server actions y API routes.
 */

import logger from './logger';

/**
 * Resultado estándar de error para server actions
 */
export interface ServerErrorResult {
    success: false;
    error: string;
}

/**
 * Resultado estándar de éxito para server actions
 */
export interface ServerSuccessResult<T = unknown> {
    success: true;
    data?: T;
}

/**
 * Tipo de resultado de server action
 */
export type ServerActionResult<T = unknown> = ServerSuccessResult<T> | ServerErrorResult;

/**
 * Extrae un mensaje de error legible de cualquier tipo de error
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }

    return 'Error desconocido';
}

/**
 * Verifica si un error es de Supabase
 */
export function isSupabaseError(error: unknown): error is { message: string; code?: string } {
    return (
        error !== null &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
    );
}

/**
 * Maneja errores de server actions de manera consistente
 * Registra el error y retorna un resultado formateado
 */
export function handleServerError(
    error: unknown,
    context: string,
    additionalContext?: Record<string, unknown>
): ServerErrorResult {
    const errorMessage = getErrorMessage(error);

    logger.error(`Error in ${context}`, error, additionalContext);

    return {
        success: false,
        error: errorMessage
    };
}

/**
 * Crea un resultado de éxito para server actions
 */
export function createSuccessResult<T>(data?: T): ServerSuccessResult<T> {
    return {
        success: true,
        ...(data !== undefined && { data })
    };
}

/**
 * Wrapper para ejecutar código con manejo de errores automático
 */
export async function withErrorHandling<T>(
    fn: () => Promise<T>,
    context: string
): Promise<ServerActionResult<T>> {
    try {
        const result = await fn();
        return createSuccessResult(result);
    } catch (error) {
        return handleServerError(error, context);
    }
}
