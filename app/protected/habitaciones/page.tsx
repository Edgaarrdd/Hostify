"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchRooms, searchRooms, Room } from "@/lib/queries/rooms";
import { getActiveReservationByRoomId } from "@/lib/actions/reservations";
import { PaginatedTable } from "@/components/PaginatedTable";

export default function HabitacionesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Disponible" | "Ocupada">("Todos");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchRooms();
        setRooms(data);
        setFilteredRooms(data);
      } catch (err: unknown) {
        setError((err as Error).message ?? "Error al cargar las habitaciones");
      } finally {
        setLoading(false);
      }
    };

    load();

    // Limpiar filtros al recargar la página
    try {
      const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
      if (nav === "reload") {
        setStatusFilter("Todos");
        setSearchQuery("");
      }
    } catch {
      // ignore
    }
  }, []);

  // Limpiar búsqueda cuando se desmonta el componente
  useEffect(() => {
    return () => {
      setSearchQuery("");
    };
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      const list = rooms;
      setFilteredRooms(statusFilter === "Todos" ? list : list.filter((r) => r.status === statusFilter));
    } else {
      try {
        const results = await searchRooms(query);
        setFilteredRooms(statusFilter === "Todos" ? results : results.filter((r) => r.status === statusFilter));
      } catch (err: unknown) {
        console.error("Error en la búsqueda:", err);
        setFilteredRooms([]);
      }
    }
  };

  const handleStatusChange = async (newStatus: "Todos" | "Disponible" | "Ocupada") => {
    setStatusFilter(newStatus);

    if (searchQuery.trim() === "") {
      const list = rooms;
      setFilteredRooms(newStatus === "Todos" ? list : list.filter((r) => r.status === newStatus));
    } else {
      try {
        const results = await searchRooms(searchQuery);
        setFilteredRooms(newStatus === "Todos" ? results : results.filter((r) => r.status === newStatus));
      } catch (err) {
        console.error("Error al filtrar por estado:", err);
      }
    }
  };

  const handleViewReservation = async (roomId: string) => {
    try {
      const reservation = await getActiveReservationByRoomId(roomId);
      if (reservation) {
        router.push(`/protected/reservas/${reservation.id}?from=habitaciones`);
      } else {
        alert("No hay reservas asociadas a esta habitación");
      }
    } catch (err) {
      console.error("Error al obtener la reserva:", err);
      alert("Error al obtener la reserva");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1>Habitaciones</h1>
        <p>Administra aquí tus habitaciones</p>
      </div>
      <Link
        href="/protected/habitaciones/nueva"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-block"
      >
        + Crear habitación
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <input
            className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
            type="text"
            placeholder="Buscar por número o tipo de habitación"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {(["Todos", "Disponible", "Ocupada"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleStatusChange(opt)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none ${statusFilter === opt
                ? "bg-primary text-primary-foreground"
                : "bg-transparent border border-border-light dark:border-border-dark text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
          Listado de habitaciones
        </h2>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando habitaciones...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <PaginatedTable
            data={filteredRooms}
            emptyMessage={searchQuery ? "No hay habitaciones que coincidan con tu búsqueda" : "No hay habitaciones registradas"}
            onPageChange={() => {
              setStatusFilter("Todos");
              setSearchQuery("");
              setFilteredRooms(rooms);
            }}
            columns={[
              {
                key: "number",
                label: "Número",
                sortable: true,
                render: (val) => <span className="font-medium text-foreground">{val}</span>
              },
              { key: "type", label: "Tipo" },
              { key: "capacity", label: "Capacidad", sortable: true },
              {
                key: "status",
                label: "Estado",
                render: (status) => (
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status === "Disponible"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                    {status}
                  </span>
                )
              },
              {
                key: "price_base",
                label: "Precio por Noche",
                sortable: true,
                render: (val) => <span className="font-medium text-foreground">${val?.toLocaleString("es-CL")}</span>
              },
              {
                key: "id",
                label: "Acciones",
                render: (_value, row) => (
                  <div className="flex items-center gap-3">
                    <Link href={`/protected/habitaciones/${row.id}`} className="text-primary hover:text-primary/80">
                      Editar
                    </Link>
                    {row.status === "Ocupada" && (
                      <button
                        onClick={() => handleViewReservation(row.id)}
                        className="text-primary hover:text-primary/80 transition-colors p-1 hover:bg-primary/10 rounded"
                        title="Ver reserva asociada"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </div>
    </div>
  );
}
