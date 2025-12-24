
import { SupabaseClient } from "@supabase/supabase-js";

export interface RoomDB {
    id: string;
    number: string;
    type: string;
    status: string;
    price_base: number;
}

export class RoomRepository {
    constructor(private supabase: SupabaseClient) { }

    async findByIds(ids: string[]): Promise<RoomDB[]> {
        const { data, error } = await this.supabase
            .from("rooms")
            .select("*")
            .in("id", ids);

        if (error) throw new Error(`Error fetching rooms: ${error.message}`);
        return data || [];
    }

    async findById(id: string): Promise<RoomDB | null> {
        const { data, error } = await this.supabase
            .from("rooms")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw new Error(`Error fetching room: ${error.message}`);
        return data;
    }

    async updateStatus(id: string, status: string): Promise<void> {
        const { error } = await this.supabase
            .from("rooms")
            .update({ status })
            .eq("id", id);

        if (error) throw new Error(`Error updating room status: ${error.message}`);
    }
}
