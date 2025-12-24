"use client";

import { useState } from "react";
import { analyzeGuestRequest } from "@/lib/services/whatsapp/ai-concierge";

interface IncidentResult {
  departamento: string;
  urgencia: string;
  sentimiento: string;
  resumen: string;
}

export default function IncidentSimulator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IncidentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!input) return;
    setLoading(true);
    setResult(null);
    const response = await analyzeGuestRequest(input);
    if (response.success) setResult(response.data);
    else alert("Error al conectar con la IA");
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Detector de Incidentes</h2>

      <textarea
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
        rows={3}
        placeholder="Ej: Hay una fuga de agua en la 101..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || !input}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Analizando..." : "Clasificar Incidente"}
      </button>

      {result && (
        <div className="mt-6 border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500 font-bold block">Departamento</span>
              <span className="text-lg font-bold text-gray-800">{result.departamento}</span>
            </div>
            <div className={`p-3 rounded-lg border-l-4 ${result.urgencia === 'Crítica' || result.urgencia === 'Alta' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'
              }`}>
              <span className="text-xs font-bold opacity-70 block">Urgencia</span>
              <span className="text-lg font-bold">{result.urgencia}</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 italic">
            &quot;{result.resumen}&quot; — Sentimiento: {result.sentimiento}
          </div>
        </div>
      )}
    </div>
  );
}