//pagina principal del panel de control
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchDashboardData } from "@/lib/queries/dashboard";
import type { Room, Stay, ActiveReservation } from "@/lib/types";
import { PaginatedTable } from "@/components/PaginatedTable";
import { SearchInput } from "@/components/SearchInput";
import { ReservationCodeLink } from "@/components/reservas/reservation-code-link";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSearchParams, useRouter } from "next/navigation";

// Force dynamic rendering to allow useSearchParams
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [activeReservations, setActiveReservations] = useState<ActiveReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ActiveReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationSearchQuery, setReservationSearchQuery] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  // Verificar error de acceso no autorizado
  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      // Usar un pequeño tiempo de espera para asegurar que se ejecute después del renderizado o usar un banner de UI en lugar de alerta?
      // La alerta es lo que se solicitó/implicó para una retroalimentación fuerte.
      // Mejor: establecer un estado de error local para mostrar un banner.
      // Pero el usuario quiere "indicando que no puede acceder...". La alerta es difícil de perder.
      // Usemos un banner para una mejor UX.
      // ¿Podemos reutilizar el estado de error? No, eso bloquea el tablero.
      // Vamos a crear un nuevo estado accessError.
      setTimeout(() => toast.error("ACCESO DENEGADO", {
        description: "Solo el Administrador puede gestionar encargados."
      }), 100);
      // Limpiar la URL
      router.replace("/protected");
    }
  }, [searchParams, router]);

  // Efecto principal para cargar los datos del dashboard al montar el componente.
  // Realiza una carga paralela de habitaciones, estadías y reservas activas.
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { rooms, stays, activeReservations } = await fetchDashboardData();
        setRooms(rooms);
        setStays(stays);
        setActiveReservations(activeReservations);
        setFilteredReservations(activeReservations);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al cargar el dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleReservationSearch = (query: string) => {
    setReservationSearchQuery(query);

    if (query.trim() === "") {
      setFilteredReservations(activeReservations);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = activeReservations.filter(res => {
        const code = res.reservation_code?.toLowerCase() || "";
        const name = res.titular_name.toLowerCase();
        const rut = res.titular_rut.toLowerCase();

        return (
          code.includes(lowerQuery) ||
          name.includes(lowerQuery) ||
          rut.includes(lowerQuery)
        );
      });
      setFilteredReservations(filtered);
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return { bg: "bg-gray-100", border: "border-gray-500", text: "Desconocido" };

    const s = status.toLowerCase();
    if (s === "disponible") {
      return { bg: "bg-green-100 dark:bg-green-900/20", border: "border-green-500 dark:border-green-400", text: "Disponible" };
    } else if (s === "ocupada") {
      return { bg: "bg-red-100 dark:bg-red-900/20", border: "border-red-500 dark:border-red-400", text: "Ocupada" };
    }
    return { bg: "bg-yellow-100 dark:bg-yellow-900/20", border: "border-yellow-500 dark:border-yellow-400", text: status };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1>Panel de Control</h1>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1>Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const occupiedCount = rooms.filter(r => r.status?.toLowerCase() === "ocupada").length;
  const availableCount = rooms.filter(r => r.status?.toLowerCase() === "disponible").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Panel de Control</h1>
        <p>Bienvenido al sistema de gestión de hoteles</p>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Habitaciones Ocupadas", value: occupiedCount },
          { label: "Habitaciones Disponibles", value: availableCount },
          { label: "Huéspedes Alojados", value: stays.length },
          { label: "Total de Habitaciones", value: rooms.length },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark text-center"
          >
            <p className="text-sm font-medium">
              {card.label}
            </p>
            <p className="text-3xl font-bold mt-2">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Sección de ocupación */}
      <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark">
        <h2>Estado de Habitaciones</h2>
        {rooms.length === 0 ? (
          <p>No hay habitaciones registradas</p>
        ) : (
          <PaginatedTable
            data={rooms}
            columns={[]}
            itemsPerPage={15}
            emptyMessage="No hay habitaciones registradas"
            customRender={(paginatedRooms) => (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                {paginatedRooms.map((room) => {
                  const statusColor = getStatusColor(room.status);
                  const isClickable = room.currentReservationId && room.status?.toLowerCase() === "ocupada";

                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        if (isClickable) {
                          router.push(`/protected/reservas/${room.currentReservationId}`);
                        }
                      }}
                      className={`p-4 rounded-lg text-center border-2 transition-all ${statusColor.bg} ${statusColor.border} ${isClickable ? "cursor-pointer hover:shadow-lg hover:scale-[1.02]" : ""}`}
                    >
                      <p className="font-bold text-lg">
                        {room.number}
                      </p>
                      <p className="text-xs mt-1">
                        {room.type}
                      </p>
                      <p className="text-xs font-semibold mt-2">
                        {statusColor.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          />
        )}
      </div>

      {/* Tabla de reservas activas */}
      <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark">
        <h2>Reservas Activas (Vigentes Hoy)</h2>
        <div className="mt-4 mb-6">
          <SearchInput
            placeholder="Buscar por código de reserva, nombre del responsable o RUT"
            value={reservationSearchQuery}
            onChange={handleReservationSearch}
          />
        </div>
        {activeReservations.length === 0 ? (
          <p className="text-muted-foreground">No hay reservas vigentes en este momento</p>
        ) : (
          <div>
            <PaginatedTable
              data={filteredReservations}
              emptyMessage={reservationSearchQuery ? "No hay reservas que coincidan con tu búsqueda" : "No hay reservas activas"}
              columns={[
                {
                  key: "reservation_code",
                  label: "Número de Reserva",
                  render: (code, row) => (
                    <ReservationCodeLink
                      code={String(code)}
                      reservationId={row.id}
                      underline
                      queryParams={{ from: "dashboard" }}
                    />
                  ),
                },
                {
                  key: "titular_name",
                  label: "Titular",
                  render: (name) => name,
                },
                {
                  key: "titular_rut",
                  label: "Número de Documento",
                  render: (rut) => rut || "-",
                },
                {
                  key: "room_number",
                  label: "Habitación",
                  render: (number, row) => (
                    <div className="text-sm">
                      <div className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900">
                        <span className="font-semibold text-blue-800 dark:text-blue-200">
                          {number}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ({row.room_type})
                      </div>
                    </div>
                  ),
                },
                {
                  key: "check_in",
                  label: "Check-in / Check-out",
                  sortable: true,
                  render: (checkIn, row) => (
                    <div className="text-sm">
                      <div>In: {checkIn ? format(new Date(checkIn as string), "dd MMM", { locale: es }) : "-"}</div>
                      <div>Out: {format(new Date(row.check_out), "dd MMM", { locale: es })}</div>
                    </div>
                  ),
                },
                {
                  key: "total",
                  label: "Total",
                  sortable: true,
                  render: (total) => `$${total?.toLocaleString("es-CL")}`,
                },
                {
                  key: "status",
                  label: "Estado Reserva",
                  render: (status) => (
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === "Cancelada"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                    >
                      {status}
                    </span>
                  ),
                },
                {
                  key: "payment_status",
                  label: "Estado Pago",
                  render: (paymentStatus, row) => (
                    <div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatus === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : paymentStatus === "partial"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                      >
                        {paymentStatus === "paid" ? "Pagado" : paymentStatus === "partial" ? "Abonado" : "Pendiente"}
                      </span>
                      {paymentStatus === "partial" && row.deposit_amount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Abono: ${row.deposit_amount?.toLocaleString("es-CL")}
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
