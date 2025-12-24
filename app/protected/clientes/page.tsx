"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchGuests, searchGuests, Guest } from "@/lib/queries/guests";
import { getGuestReservations, ReservationByGuest } from "@/lib/queries/guest-reservations";
import { PaginatedTable } from "@/components/PaginatedTable";
import { ReservationCodeLink } from "@/components/reservas/reservation-code-link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RoomInfo {
  number: string;
  type: string;
}

export default function ClientesPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationByGuest[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationSearchQuery, setReservationSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchGuests();
        setGuests(data);
        setFilteredGuests(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar los clientes");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Limpiar búsqueda cuando se desmonta el componente
  useEffect(() => {
    return () => {
      setSearchQuery("");
      setSelectedGuestId(null);
      setReservations([]);
    };
  }, []);

  // Cargar reservas cuando se selecciona un huésped
  useEffect(() => {
    if (!selectedGuestId) return;

    const load = async () => {
      try {
        setLoadingReservations(true);
        const data = await getGuestReservations(selectedGuestId);
        setReservations(data);
      } catch (err: unknown) {
        console.error("Error al cargar reservas:", err);
        setReservations([]);
      } finally {
        setLoadingReservations(false);
      }
    };

    load();
  }, [selectedGuestId]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredGuests(guests);
    } else {
      try {
        const results = await searchGuests(query);
        setFilteredGuests(results);
      } catch (err: unknown) {
        console.error("Error en la búsqueda:", err);
        setFilteredGuests([]);
      }
    }
  };

  const getFilteredReservations = () => {
    if (!reservationSearchQuery.trim()) {
      return reservations;
    }

    const query = reservationSearchQuery.toLowerCase();
    return reservations.filter(res => {
      const roomNumbers = res.rooms?.map(r => r.number).join(", ") || "";
      const roomTypes = res.rooms?.map(r => r.type).join(", ") || "";
      const code = res.reservation_code?.toLowerCase() || "";

      return (
        code.includes(query) ||
        roomNumbers.toLowerCase().includes(query) ||
        roomTypes.toLowerCase().includes(query) ||
        res.status.toLowerCase().includes(query) ||
        res.payment_status.toLowerCase().includes(query)
      );
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1>Clientes</h1>
        <p>Aquí se muestra el listado de huéspedes responsables</p>
      </div>

      <Link
        href="/protected/clientes/nuevo"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-block"
      >
        + Crear huésped
      </Link>

      <div>
        <input
          className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
          type="text"
          placeholder="Buscar por nombre, RUT, teléfono o email"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
          Listado de clientes
        </h2>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando clientes...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <PaginatedTable
            data={filteredGuests}
            emptyMessage={searchQuery ? "No hay clientes que coincidan con tu búsqueda" : "No hay clientes registrados"}
            columns={[
              {
                key: "nombre",
                label: "Nombre",
                render: (_, row) => `${row.nombre} ${row.apellido} `,
              },
              { key: "numero_documento", label: "RUT" },
              {
                key: "telefono",
                label: "Teléfono",
                render: (value) => value || "-",
              },
              {
                key: "email",
                label: "Email",
                render: (value) => value || "-",
              },
              {
                key: "id",
                label: "Acciones",
                render: (id) => (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedGuestId(id)}
                      className="text-primary hover:text-primary/80"
                    >
                      Ver historial
                    </button>
                    <Link href={`/ protected / clientes / ${id} /editar`} className="text-primary hover:text-primary/80">
                      Editar
                    </Link >
                  </div >
                ),
              },
            ]}
          />
        )}
      </div >

      {/* Modal de Historial */}
      {
        selectedGuestId && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-card rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white dark:bg-card border-b border-border-light dark:border-border-dark p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Historial de Reservas</h2>
                <button
                  onClick={() => {
                    setSelectedGuestId(null);
                    setReservations([]);
                    setReservationSearchQuery("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="bg-white dark:bg-card border-b border-border-light dark:border-border-dark p-6">
                <input
                  type="text"
                  placeholder="Buscar por número de reserva, habitación, estado, etc."
                  value={reservationSearchQuery}
                  onChange={(e) => setReservationSearchQuery(e.target.value)}
                  className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-muted text-foreground"
                />
              </div>
              <div className="overflow-y-auto flex-1 p-6">
                {loadingReservations ? (
                  <div className="text-center py-12 text-muted-foreground">Cargando reservas...</div>
                ) : reservations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No hay reservas para este huésped</div>
                ) : getFilteredReservations().length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No hay reservas que coincidan con tu búsqueda</div>
                ) : (
                  <PaginatedTable
                    data={getFilteredReservations()}
                    emptyMessage="No hay reservas que coincidan con tu búsqueda"
                    rowClassName={(row) => `transition-colors ${row.status === 'Cancelada' ? 'bg-gray-100 dark:bg-muted/50 opacity-75' : 'hover:bg-gray-50 dark:hover:bg-muted/20'}`}
                    columns={[
                      {
                        key: "reservation_code",
                        label: "Número de Reserva",
                        render: (val, row) => (
                          <ReservationCodeLink
                            code={val as string}
                            reservationId={row.id}
                            underline
                          />
                        )
                      },
                      {
                        key: "rooms",
                        label: "Habitación",
                        render: (rooms: string | number | RoomInfo[] | null) => {
                          if (!rooms || typeof rooms === 'string' || typeof rooms === 'number') {
                            return <span className="text-sm text-muted-foreground">N/A</span>;
                          }
                          return (
                            <div className="flex flex-wrap gap-2">
                              {rooms.length > 0 ? (
                                rooms.map((room: RoomInfo, idx: number) => (
                                  <span key={idx} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {room.number} ({room.type})
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </div>
                          );
                        }
                      },
                      {
                        key: "dates",
                        label: "Fechas",
                        render: (_, row) => (
                          <div className="text-sm text-subtext-light dark:text-subtext-dark">
                            <div>In: {format(new Date(row.check_in), "dd MMM", { locale: es })}</div>
                            <div>Out: {format(new Date(row.check_out), "dd MMM", { locale: es })}</div>
                            <div className="text-xs text-muted-foreground">({row.cantidad_noches} noches)</div>
                          </div>
                        )
                      },
                      {
                        key: "total",
                        label: "Total",
                        render: (val) => <span className="font-medium text-foreground">${val?.toLocaleString("es-CL")}</span>
                      },
                      {
                        key: "status",
                        label: "Estado",
                        render: (status, row) => (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Cancelada'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : (row.payment_status === 'paid' || row.payment_status === 'partial')
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                            {status === 'Cancelada' ? 'Cancelada' : (row.payment_status === 'paid' || row.payment_status === 'partial') ? 'Confirmada' : 'Pendiente'}
                          </span>
                        )
                      },
                      {
                        key: "payment_status",
                        label: "Estado Pago",
                        render: (paymentStatus, row) => (
                          <div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                              {paymentStatus === 'paid' ? 'Pagado' : paymentStatus === 'partial' ? 'Abonado' : 'Pendiente'}
                            </span>
                            {paymentStatus === 'partial' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Abono: ${row.deposit_amount?.toLocaleString("es-CL")}
                              </div>
                            )}
                          </div>
                        )
                      }
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}