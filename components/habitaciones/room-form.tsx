"use client";

import { useState, useImperativeHandle, forwardRef, useEffect, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoomFormData } from "@/lib/types";

/**
 * Componente de formulario para crear o editar habitaciones.
 * Utiliza `forwardRef` para exponer métodos al componente padre.
 */
interface RoomFormProps {
  onSubmit?: (data: RoomFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  isEditing?: boolean;
  initialData?: RoomFormData;
}

export const RoomForm = forwardRef<{ reset: () => void }, RoomFormProps>(
  ({ onSubmit, onDelete, isLoading = false, isDeleting = false, isEditing = false, initialData }, ref) => {
    const [formData, setFormData] = useState<RoomFormData>({
      number: "",
      type: "",
      capacity: "",
      price_base: "",
      status: "Disponible",
    });

    useEffect(() => {
      if (initialData) {
        setFormData(initialData);
      }
    }, [initialData]);

    // Permite al componente padre llamar a la función reset() de este componente
    // usando una referencia (ref).
    useImperativeHandle(ref, () => ({
      reset: () => {
        setFormData({
          number: "",
          type: "",
          capacity: "",
          price_base: "",
          status: "Disponible",
        });
      },
    }));

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(formData);
      }
    };

    return (
      <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="number">Número de Habitación</Label>
            <Input
              id="number"
              name="number"
              type="text"
              placeholder="Ej: 101"
              value={formData.number}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Habitación</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-gray-50 dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona un tipo</option>
              <option value="Simple">Simple</option>
              <option value="Doble">Doble</option>
              <option value="Triple">Triple</option>
              <option value="Suite">Suite</option>
              <option value="Familiar">Familiar</option>
            </select>
          </div>

          <div>
            <Label htmlFor="capacity">Capacidad</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              placeholder="Ej: 2"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="price_base">Precio por Noche</Label>
            <Input
              id="price_base"
              name="price_base"
              type="number"
              placeholder="Ej: 30000"
              value={formData.price_base}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Editar Habitación" : "Crear Habitación")}
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Eliminando..." : "Eliminar Habitación"}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }
);

RoomForm.displayName = "RoomForm";
