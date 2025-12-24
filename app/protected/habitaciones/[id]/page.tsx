"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomForm } from "@/components/habitaciones/room-form";
import { updateRoom, fetchRoomById, deleteRoom, getReservationCountByRoomId } from "@/lib/queries/rooms";

interface RoomFormData {
  number: string;
  type: string;
  capacity: string;
  price_base: string;
  status: string;
}

export default function EditarHabitacionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const formRef = useRef<{ reset: () => void }>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialData, setInitialData] = useState<RoomFormData | null>(null);

  // Obtener el ID de los params
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setRoomId(id);
    })();
  }, [params]);

  // Cargar los datos de la habitación
  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      try {
        setIsLoadingRoom(true);
        const room = await fetchRoomById(roomId);

        if (!room) {
          setError("Habitación no encontrada");
          return;
        }

        setInitialData({
          number: room.number,
          type: room.type,
          capacity: room.capacity.toString(),
          price_base: room.price_base?.toString() || "0",
          status: room.status || "Disponible",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar la habitación");
      } finally {
        setIsLoadingRoom(false);
      }
    };

    load();
  }, [roomId]);

  const handleFormSubmit = async (data: RoomFormData) => {
    if (!roomId) {
      setError("ID de habitación no disponible");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateRoom(roomId, {
        number: data.number,
        type: data.type,
        capacity: parseInt(data.capacity),
        price_base: parseFloat(data.price_base),
        status: data.status,
      });

      // Actualizar los datos iniciales con los nuevos valores
      setInitialData(data);
      setSuccess(true);
      console.log("Habitación actualizada con éxito:", result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar la habitación";
      setError(errorMessage);
      console.error("Error al actualizar la habitación:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSuccess(false);
    setError(null);
    router.push("/protected/habitaciones");
  };

  const handleDelete = async () => {
    if (!initialData) return;

    // Validar que no esté ocupada
    if (initialData.status === "Ocupada") {
      alert("No se puede eliminar esta habitación porque está Ocupada");
      return;
    }

    // Contar reservas
    try {
      const reservationCount = await getReservationCountByRoomId(roomId!);

      const confirmMessage = reservationCount > 0
        ? `Hay ${reservationCount} reserva${reservationCount > 1 ? 's' : ''} para esa habitación.\n\nSi apretas "Aceptar" se eliminará la habitación. ¿Desea confirmar?`
        : `Si apretas "Aceptar" se eliminará la habitación. ¿Desea confirmar?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setIsDeleting(true);
      setError(null);

      await deleteRoom(roomId!);

      // Redirigir a la lista después de eliminar
      router.push("/protected/habitaciones");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la habitación");
      setIsDeleting(false);
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="space-y-8">
        <div>
          <h1>Editar Habitación</h1>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1>Editar Habitación</h1>
        <p>Actualiza los datos de la habitación</p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-500 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && initialData && (
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-500 text-green-600 p-6 rounded-lg space-y-4">
          <div className="font-semibold text-lg">✓ ¡Habitación actualizada con éxito!</div>
          <div className="space-y-2 text-sm">
            <p><strong>Número:</strong> {initialData.number}</p>
            <p><strong>Tipo:</strong> {initialData.type}</p>
            <p><strong>Capacidad:</strong> {initialData.capacity} personas</p>
            <p><strong>Precio:</strong> ${parseFloat(initialData.price_base).toLocaleString()}</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleBack}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      )}

      {!success && initialData && (
        <RoomForm
          ref={formRef}
          onSubmit={handleFormSubmit}
          onDelete={handleDelete}
          isLoading={isLoading}
          isDeleting={isDeleting}
          isEditing={true}
          initialData={initialData}
        />
      )}
    </div>
  );
}
