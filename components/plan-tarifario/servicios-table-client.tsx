"use client";

import { useState } from "react";
import { Service } from "@/lib/queries/services";
import { ServiceEditModal } from "@/components/plan-tarifario/service-edit-modal";
import { ServiceCreateModal } from "@/components/plan-tarifario/service-create-modal";
import { PaginatedTable } from "@/components/PaginatedTable";

interface ServiciosTableClientProps {
  servicios: Service[];
}

export function ServiciosTableClient({ servicios }: ServiciosTableClientProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-block"
        >
          + Crear servicio
        </button>
      </div>

      <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
        Servicios Adicionales ({servicios.length})
      </h2>

      <PaginatedTable
        data={servicios}
        emptyMessage="No hay servicios registrados"
        columns={[
          {
            key: "service",
            label: "Servicio",
            sortable: true,
            render: (val) => <span className="font-medium text-foreground">{val}</span>
          },
          {
            key: "price",
            label: "Precio",
            sortable: true,
            render: (val) => <span className="text-foreground">${val?.toLocaleString("es-CL")}</span>
          },
          {
            key: "start_time",
            label: "Horario",
            sortable: false,
            render: (_val, row) => (
              <span className="text-foreground">
                {row.start_time || row.end_time
                  ? `${row.start_time?.slice(0, 5) || ''} - ${row.end_time?.slice(0, 5) || ''}`
                  : '-'}
              </span>
            )
          },
          {
            key: "id",
            label: "Acciones",
            render: (_, row) => (
              <button
                onClick={() => setSelectedService(row)}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Editar
              </button>
            )
          }
        ]}
      />

      {selectedService && (
        <ServiceEditModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

      {isCreateModalOpen && (
        <ServiceCreateModal
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </>
  );
}
