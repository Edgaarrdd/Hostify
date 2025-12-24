import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";

export async function SidebarWrapper() {
  const supabase = await createClient();

  // 1. Obtener usuario real de la sesión
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email || "";

  // 2. LÓGICA DE NOMBRE:
  let name = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;

  if (!name) {
    name = "-";
  } else {
    name = name.split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // 3. LÓGICA DE ROL (para Sidebar):
  const role = user.app_metadata?.role || user.user_metadata?.role;

  return (
    <Sidebar
      userName={name}
      userEmail={email}
      userRole={role}
    />
  );
}