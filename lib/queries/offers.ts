"use server";

import { createClient } from "@/lib/supabase/server";
import { Offer } from "@/lib/types/models";

export async function fetchOffers(): Promise<Offer[]> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("offers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data as Offer[]) || [];
    } catch (error: unknown) {
        console.error("Error fetching offers:", error);
        return [];
    }
}

export async function getActiveOffers(): Promise<Offer[]> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    try {
        const { data, error } = await supabase
            .from("offers")
            .select("*")
            .eq("status", "active")
            .lte("start_date", today)
            .gte("end_date", today)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data as Offer[]) || [];
    } catch (error: unknown) {
        console.error("Error fetching active offers:", error);
        return [];
    }
}

export async function fetchOfferById(id: string): Promise<Offer | null> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("offers")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        return data as Offer;
    } catch (error: unknown) {
        console.error(`Error fetching offer ${id}:`, error);
        return null;
    }
}
