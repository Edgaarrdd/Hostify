import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Especialmente importante si usas computación fluida: No pongas este cliente en una
 * variable global. Siempre crea un nuevo cliente dentro de cada función cuando lo uses.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
              cookieStore.set(name, value, options),
            );
          } catch {
            // El método `setAll` fue llamado desde un Server Component.
            // Esto puede ser ignorado si tienes un proxy refrescando
            // las sesiones de usuario.
          }
        },
      },
    },
  );
}
