"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OfferFormData } from "@/lib/types/forms";
import { ServerActionResult } from "@/lib/types/api";

export async function createOffer(data: OfferFormData): Promise<ServerActionResult<void>> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from("offers").insert({
            title: data.title,
            description: data.description,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            start_date: data.start_date,
            end_date: data.end_date,
            code: data.code || null,
            status: data.status,
        });

        if (error) throw error;

        revalidatePath("/protected/ofertas");
        return { success: true, message: "Oferta creada correctamente" };
    } catch (error: unknown) {
        console.error("Error creating offer:", error);
        return { success: false, error: "Error al crear la oferta" };
    }
}

export async function updateOffer(id: string, data: OfferFormData): Promise<ServerActionResult<void>> {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("offers")
            .update({
                title: data.title,
                description: data.description,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                start_date: data.start_date,
                end_date: data.end_date,
                code: data.code || null,
                status: data.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/protected/ofertas");
        return { success: true, message: "Oferta actualizada correctamente" };
    } catch (error: unknown) {
        console.error("Error updating offer:", error);
        return { success: false, error: "Error al actualizar la oferta" };
    }
}

export async function deleteOffer(id: string): Promise<ServerActionResult<void>> {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from("offers").delete().eq("id", id);

        if (error) throw error;

        revalidatePath("/protected/ofertas");
        return { success: true, message: "Oferta eliminada correctamente" };
    } catch (error: unknown) {
        console.error("Error deleting offer:", error);
        return { success: false, error: "Error al eliminar la oferta" };
    }
}

export async function toggleOfferStatus(id: string, currentStatus: string): Promise<ServerActionResult<void>> {
    const supabase = await createClient();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
        const { error } = await supabase
            .from("offers")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/protected/ofertas");
        return { success: true, message: `Oferta ${newStatus === 'active' ? 'activada' : 'desactivada'} correctamente` };
    } catch (error: unknown) {
        console.error("Error toggling offer status:", error);
        return { success: false, error: "Error al cambiar el estado de la oferta" };
    }
}
