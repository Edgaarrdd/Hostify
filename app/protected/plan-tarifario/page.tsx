import { Suspense } from "react";
import { fetchServices } from "@/lib/queries/services";
import { ServiciosTableClient } from "@/components/plan-tarifario/servicios-table-client";

async function ServiciosTable() {
  const servicios = await fetchServices();

  return <ServiciosTableClient servicios={servicios} />;
}

export default function PlanTarifarioPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Plan Tarifario</h1>
        <p>Administra aquí los planes tarifarios del hotel</p>
      </div>
      <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Cargando servicios...</div>}>
        <ServiciosTable />
      </Suspense>
    </div>
  );
}
