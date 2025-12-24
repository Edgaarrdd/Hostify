import IncidentSimulator from "@/components/IncidentSimulator";

export default function OperacionesPage() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Centro de Operaciones IA
        </h1>
      </div>
      
      {/* Contenedor principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Aquí cargamos el simulador */}
        <IncidentSimulator />

        {/* Un cuadro explicativo para que no se vea vacío al lado */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit">
          <h3 className="font-bold text-blue-900 mb-2">¿Cómo funciona?</h3>
          <p className="text-blue-800 text-sm mb-4">
            Este módulo utiliza Inteligencia Artificial Generativa para procesar solicitudes de huéspedes en tiempo real.
          </p>
          <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
            <li>Detecta urgencias críticas (fugas, seguridad).</li>
            <li>Asigna tareas al departamento correcto.</li>
            <li>Analiza el sentimiento del cliente.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}