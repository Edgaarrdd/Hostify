"use server";

import { createClient } from "@/lib/supabase/server";
/**
 * Busca un huésped en la base de datos utilizando su RUT.
 * Es útil para autocompletar formularios si el cliente ya ha visitado el hotel antes.
 * 
 * @param rut - El RUT del huésped a buscar (formato esperado según la DB)
 * @returns Los datos del huésped formateados para el frontend o null si no existe.
 */
export async function getGuestByRut(rut: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("guests")
            .select("*")
            .eq("tipo_documento", "RUT")
            .eq("numero_documento", rut)
            .single();

        if (error) {
            // It's okay if not found, just return null, don't log error as 'failed' unless it's a real error
            if (error.code !== "PGRST116") { // PGRST116 es "Relación no encontrada" o "Resultado contiene 0 filas"
                console.error("Error fetching guest:", error.message);
            }
            return null;
        }

        if (!data) return null;

        // Mapear campos de BD a interfaz Guest del frontend 
        return {
            firstName: data.nombre,
            lastName: data.apellido,
            email: data.email,
            phone: data.telefono,
            birthDate: data.fecha_nacimiento ? new Date(data.fecha_nacimiento).toISOString().split('T')[0] : "",
            country: data.pais_origen,
            city: data.ciudad,
        };

    } catch (err) {
        console.error("Unexpected error fetching guest:", err);
        return null;
    }
}
