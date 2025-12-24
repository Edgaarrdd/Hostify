"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Actualiza los datos de un servicio existente (nombre, precio, horario).
 * 
 * @param id - ID del servicio a actualizar.
 * @param service - Nuevo nombre del servicio.
 * @param price - Nuevo precio.
 * @param start_time - Hora de inicio (opcional).
 * @param end_time - Hora de término (opcional).
 * @returns Objeto con éxito/fallo y datos actualizados.
 */
export async function updateService(id: number, service: string, price: number, start_time?: string, end_time?: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("services")
      .update({ service, price, start_time, end_time })
      .eq("id", id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/protected/plan-tarifario");
    return { success: true, data };
  } catch (error) {
    console.error("Error updating service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Elimina un servicio del sistema.
 * 
 * @param id - ID del servicio a eliminar.
 */
export async function deleteService(id: number) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/protected/plan-tarifario");
    return { success: true };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Crea un nuevo servicio adicional disponible para las reservas.
 * 
 * @param service - Nombre del nuevo servicio.
 * @param price - Precio unitario del servicio.
 * @param start_time - Hora de inicio (opcional).
 * @param end_time - Hora de término (opcional).
 */
export async function createService(service: string, price: number, start_time?: string, end_time?: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("services")
      .insert([{ service, price, start_time, end_time }])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/protected/plan-tarifario");
    return { success: true, data };
  } catch (error) {
    console.error("Error creating service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
