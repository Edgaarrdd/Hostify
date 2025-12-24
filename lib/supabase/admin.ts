import { createClient } from '@supabase/supabase-js';

// Nota: SUPABASE_SERVICE_ROLE_KEY proporciona acceso total de administrador a la base de datos.
// Este cliente SOLO debe usarse en contextos seguros del lado del servidor (Server Actions, API Routes).
// NUNCA expongas este cliente o la clave al navegador.

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
