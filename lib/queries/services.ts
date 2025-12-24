"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface Service {
  id: number;
  service: string;
  price: number;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
}

export async function fetchServices() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // usage from Server Component, ignored
          }
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
      throw new Error(error.message);
    }

    console.log("Services fetched:", data);
    return data as Service[];
  } catch (error) {
    console.error("Error in fetchServices:", error);
    throw error;
  }
}
