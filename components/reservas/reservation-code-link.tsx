import Link from "next/link";

interface ReservationCodeLinkProps {
  code: string | null | undefined;
  reservationId: string;
  underline?: boolean;
  queryParams?: Record<string, string>;
}

/**
 * Componente reutilizable para mostrar el número de reserva como un link
 * Aplicable en dashboard, clientes, reservas y otros módulos
 * 
 * @param code - Código de la reserva
 * @param reservationId - ID de la reserva
 * @param underline - Si debe mostrar subrayado en hover (default: true)
 * @param queryParams - Parámetros de query adicionales
 */
export function ReservationCodeLink({
  code,
  reservationId,
  underline = true,
  queryParams = {},
}: ReservationCodeLinkProps) {
  const baseUrl = `/protected/reservas/${reservationId}`;
  const queryString = new URLSearchParams(queryParams).toString();
  const href = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  return (
    <Link
      href={href}
      className={`font-mono text-primary font-bold ${
        underline ? "hover:underline" : "hover:text-primary/80"
      } transition-colors`}
    >
      {code || "N/A"}
    </Link>
  );
}
