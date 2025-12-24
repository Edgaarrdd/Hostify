/**
 * Sistema de Logging Estructurado
 * 
 * Proporciona funciones de logging con niveles que se pueden controlar
 * según el entorno (desarrollo vs producción).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Formatea un mensaje de log con contexto adicional
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Logger para mensajes de debug (solo en desarrollo)
 */
export function debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
        console.log(formatMessage('debug', message, context));
    }
}

/**
 * Logger para información general
 */
export function info(message: string, context?: LogContext): void {
    console.log(formatMessage('info', message, context));
}

/**
 * Logger para advertencias
 */
export function warn(message: string, error?: unknown, context?: LogContext): void {
    const warnContext: LogContext = context ? { ...context } : {};

    if (error) {
        warnContext.error = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : error;
    }

    console.warn(formatMessage('warn', message, warnContext));
}

/**
 * Logger para errores con contexto completo
 */
export function error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext: LogContext = context ? { ...context } : {};

    if (error) {
        errorContext.error = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : error;
    }

    console.error(formatMessage('error', message, errorContext));
}

/**
 * Exportación por defecto con todos los métodos
 */
const logger = {
    debug,
    info,
    warn,
    error
};

export default logger;
