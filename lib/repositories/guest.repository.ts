
import { SupabaseClient } from "@supabase/supabase-js";

export interface GuestDB {
    id: string;
    tipo_documento: string;
    numero_documento: string;
    nombre: string;
    apellido: string;
    pais_origen: string;
    ciudad: string | null;
    fecha_nacimiento: string | null;
    email: string | null;
    telefono: string | null;
    created_at?: string;
}

export interface CreateGuestDTO {
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    country: string;
    city?: string;
    birthDate?: Date | null;
    email?: string;
    phone?: string;
}

export class GuestRepository {
    constructor(private supabase: SupabaseClient) { }

    async findByDocument(type: string, number: string): Promise<GuestDB | null> {
        const { data, error } = await this.supabase
            .from("guests")
            .select("*")
            .eq("tipo_documento", type)
            .eq("numero_documento", number)
            .single();

        if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
            throw new Error(`Error finding guest: ${error.message}`);
        }

        return data;
    }

    async findById(id: string): Promise<GuestDB | null> {
        const { data, error } = await this.supabase
            .from("guests")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw new Error(`Error finding guest by ID: ${error.message}`);
        return data;
    }

    async create(guest: CreateGuestDTO): Promise<GuestDB> {
        const { data, error } = await this.supabase
            .from("guests")
            .insert({
                tipo_documento: guest.documentType,
                numero_documento: guest.documentNumber,
                nombre: guest.firstName,
                apellido: guest.lastName,
                pais_origen: guest.country,
                ciudad: guest.city,
                fecha_nacimiento: guest.birthDate,
                email: guest.email,
                telefono: guest.phone,
            })
            .select("*")
            .single();

        if (error) throw new Error(`Error creating guest: ${error.message}`);
        return data;
    }

    async update(id: string, guest: Partial<CreateGuestDTO>): Promise<GuestDB> {
        const updates: any = {};
        if (guest.firstName) updates.nombre = guest.firstName;
        if (guest.lastName) updates.apellido = guest.lastName;
        if (guest.country) updates.pais_origen = guest.country;
        if (guest.city) updates.ciudad = guest.city;
        if (guest.birthDate) updates.fecha_nacimiento = guest.birthDate;
        if (guest.email) updates.email = guest.email;
        if (guest.phone) updates.telefono = guest.phone;

        const { data, error } = await this.supabase
            .from("guests")
            .update(updates)
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw new Error(`Error updating guest: ${error.message}`);
        return data;
    }
}
