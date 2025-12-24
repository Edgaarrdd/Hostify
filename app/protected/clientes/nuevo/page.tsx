"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGuest } from "@/lib/queries/guests";
import { COUNTRIES } from "@/lib/config/constants";

interface GuestFormData {
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  pais_origen: string;
  ciudad: string;
  fecha_nacimiento: string;
  email: string;
  telefono: string;
}

export default function NuevoClientePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdGuest, setCreatedGuest] = useState<GuestFormData | null>(null);
  const [formData, setFormData] = useState<GuestFormData>({
    tipo_documento: "RUT",
    numero_documento: "",
    nombre: "",
    apellido: "",
    pais_origen: "",
    ciudad: "",
    fecha_nacimiento: "",
    email: "",
    telefono: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createGuest({
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento,
        nombre: formData.nombre,
        apellido: formData.apellido,
        pais_origen: formData.pais_origen || null,
        ciudad: formData.ciudad || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        email: formData.email || null,
        telefono: formData.telefono || null,
      });

      setCreatedGuest(formData);
      setSuccess(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(message);
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setSuccess(false);
    setCreatedGuest(null);
    setFormData({
      tipo_documento: "RUT",
      numero_documento: "",
      nombre: "",
      apellido: "",
      pais_origen: "",
      ciudad: "",
      fecha_nacimiento: "",
      email: "",
      telefono: "",
    });
  };

  const handleBack = () => {
    router.push("/protected/clientes");
  };

  if (success && createdGuest) {
    return (
      <div className="space-y-8">
        <div>
          <h1>Crear Huésped</h1>
          <p>Nuevo huésped registrado</p>
        </div>

        <div className="bg-green-100 dark:bg-green-900/20 border border-green-500 text-green-600 p-6 rounded-lg space-y-4">
          <div className="font-semibold text-lg">✓ ¡Huésped creado con éxito!</div>
          <div className="space-y-2 text-sm">
            <p><strong>Nombre:</strong> {createdGuest.nombre} {createdGuest.apellido}</p>
            <p><strong>Tipo de Documento:</strong> {createdGuest.tipo_documento}</p>
            <p><strong>Número de Documento:</strong> {createdGuest.numero_documento}</p>
            {createdGuest.email && <p><strong>Email:</strong> {createdGuest.email}</p>}
            {createdGuest.telefono && <p><strong>Teléfono:</strong> {createdGuest.telefono}</p>}
            {createdGuest.pais_origen && <p><strong>País de Origen:</strong> {createdGuest.pais_origen}</p>}
            {createdGuest.ciudad && <p><strong>Ciudad:</strong> {createdGuest.ciudad}</p>}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreateAnother}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Crear otro huésped
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Volver al listado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1>Crear Huésped</h1>
        <p>Registra un nuevo huésped en el sistema</p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-500 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
                required
              >
                <option value="RUT">RUT</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Cédula">Cédula</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Número de Documento</label>
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">País de Origen</label>
              <select
                name="pais_origen"
                value={formData.pais_origen}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
              >
                <option value="">Seleccionar país...</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fecha de Nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creando..." : "Crear Huésped"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
