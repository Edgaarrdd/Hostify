"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RoomForm } from "@/components/habitaciones/room-form";
import type { RoomFormData } from "@/lib/types";
import { createRoom } from "@/lib/queries/rooms";

export default function NuevaHabitacionPage() {
  const router = useRouter();
  const formRef = useRef<{ reset: () => void }>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ number: string; type: string; capacity: number; price_base: number } | null>(null);

  const handleFormSubmit = async (data: RoomFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await createRoom({
        number: data.number,
        type: data.type,
        capacity: parseInt(data.capacity),
        price_base: parseFloat(data.price_base),
        status: data.status,
      });

      setCreatedRoom(result);
      setSuccess(true);
      console.log("Habitación creada con éxito:", result);

      // Limpiar el formulario
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(message); // Assuming the user wants to set the error state, not just alert
      console.error("Error al crear la habitación:", error); // Log the unknown error
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSuccess(false);
    setError(null);
    setCreatedRoom(null);
  };

  const handleGoToList = () => {
    router.push("/protected/habitaciones");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1>Crear Habitación</h1>
        <p>Completa el formulario para agregar una nueva habitación</p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-500 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && createdRoom && (
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-500 text-green-600 p-6 rounded-lg space-y-4">
          <div className="font-semibold text-lg">✓ ¡Habitación creada con éxito!</div>
          <div className="space-y-2 text-sm">
            <p><strong>Número:</strong> {createdRoom.number}</p>
            <p><strong>Tipo:</strong> {createdRoom.type}</p>
            <p><strong>Capacidad:</strong> {createdRoom.capacity} personas</p>
            <p><strong>Precio:</strong> ${createdRoom.price_base?.toLocaleString()}</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleBack}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Crear Otra Habitación
            </button>
            <button
              onClick={handleGoToList}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ver todas las habitaciones
            </button>
          </div>
        </div>
      )}

      {!success && (
        <RoomForm
          ref={formRef}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}