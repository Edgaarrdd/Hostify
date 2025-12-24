"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Tipos de datos para clientes/huéspedes
 */
export interface Guest {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  pais_origen: string | null;
  ciudad: string | null;
  fecha_nacimiento: string | null;
}

/**
 * Obtiene todos los huéspedes responsables
 */
export async function fetchGuests(): Promise<Guest[]> {
  const supabase = await createServerClient();

  try {
    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .order("nombre", { ascending: true });

    if (guestsError) {
      throw new Error(`Error al obtener huéspedes: ${guestsError.message}`);
    }

    return (guestsData || []) as Guest[];
  } catch (error: unknown) {
    console.error("Error en fetchGuests:", error);
    throw error;
  }
}

/**
 * Busca huéspedes por nombre, RUT, teléfono o email
 */
export async function searchGuests(query: string): Promise<Guest[]> {
  const supabase = await createServerClient();

  try {
    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .or(
        `nombre.ilike.%${query}%,apellido.ilike.%${query}%,numero_documento.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`
      )
      .order("nombre", { ascending: true });

    if (guestsError) {
      throw new Error(`Error al buscar huéspedes: ${guestsError.message}`);
    }

    return (guestsData || []) as Guest[];
  } catch (error: unknown) {
    console.error("Error en searchGuests:", error);
    throw error;
  }
}

/**
 * Obtiene un huésped por ID
 */
export async function fetchGuestById(id: string): Promise<Guest | null> {
  const supabase = await createServerClient();

  try {
    const { data: guestData, error: guestError } = await supabase
      .from("guests")
      .select("*")
      .eq("id", id)
      .single();

    if (guestError) {
      throw new Error(`Error al obtener huésped: ${guestError.message}`);
    }

    if (!guestData) return null;

    return guestData as Guest;
  } catch (error: unknown) {
    console.error("Error en fetchGuestById:", error);
    throw error;
  }
}

/**
 * Actualiza un huésped existente (Server Action)
 */
export async function updateGuest(
  id: string,
  data: {
    tipo_documento: string;
    numero_documento: string;
    nombre: string;
    apellido: string;
    pais_origen: string | null;
    ciudad: string | null;
    fecha_nacimiento: string | null;
    email: string | null;
    telefono: string | null;
  }
): Promise<Guest> {
  const supabase = await createServerClient();

  try {
    const { data: updatedGuest, error } = await supabase
      .from("guests")
      .update({
        tipo_documento: data.tipo_documento,
        numero_documento: data.numero_documento,
        nombre: data.nombre,
        apellido: data.apellido,
        pais_origen: data.pais_origen,
        ciudad: data.ciudad,
        fecha_nacimiento: data.fecha_nacimiento,
        email: data.email,
        telefono: data.telefono,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('guests_doc_unique')) {
        throw new Error(`Ya existe otro huésped registrado con el documento ${data.numero_documento}`);
      }
      throw new Error(`Error al actualizar huésped: ${error.message}`);
    }

    if (!updatedGuest) {
      throw new Error("El huésped no fue actualizado correctamente");
    }

    return updatedGuest as Guest;
  } catch (error: unknown) {
    console.error("Error en updateGuest:", error);
    throw error;
  }
}

/**
 * Crea un nuevo huésped (Server Action)
 */
export async function createGuest(data: {
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  pais_origen: string | null;
  ciudad: string | null;
  fecha_nacimiento: string | null;
  email: string | null;
  telefono: string | null;
}): Promise<Guest> {
  const supabase = await createServerClient();

  try {
    const { data: newGuest, error } = await supabase
      .from("guests")
      .insert({
        tipo_documento: data.tipo_documento,
        numero_documento: data.numero_documento,
        nombre: data.nombre,
        apellido: data.apellido,
        pais_origen: data.pais_origen,
        ciudad: data.ciudad,
        fecha_nacimiento: data.fecha_nacimiento,
        email: data.email,
        telefono: data.telefono,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('guests_doc_unique')) {
        throw new Error(`Ya existe un huésped registrado con el documento ${data.numero_documento}`);
      }
      throw new Error(`Error al crear huésped: ${error.message}`);
    }

    if (!newGuest) {
      throw new Error("El huésped no fue creado correctamente");
    }

    return newGuest as Guest;
  } catch (error: unknown) {
    console.error("Error en createGuest:", error);
    throw error;
  }
}
