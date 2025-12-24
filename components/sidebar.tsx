"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { LayoutDashboard, Calendar, BedDouble, Users, BarChart3, CreditCard, User, Bot, Tag } from "lucide-react";
import Image from "next/image";

const navigationItems = [
  { name: "Dashboard", href: "/protected", icon: LayoutDashboard },
  { name: "Reservas", href: "/protected/reservas", icon: Calendar },
  { name: "Habitaciones", href: "/protected/habitaciones", icon: BedDouble },
  { name: "Clientes", href: "/protected/clientes", icon: Users },
  { name: "Ofertas", href: "/protected/ofertas", icon: Tag },
  { name: "Reportes", href: "/protected/reportes", icon: BarChart3 },
  { name: "Plan Tarifario", href: "/protected/plan-tarifario", icon: CreditCard },
  { name: "Encargados", href: "/protected/encargados", icon: User },
  { name: "Operaciones IA", href: "/protected/operaciones", icon: Bot },
];

export function Sidebar({
  userRole = 'encargado',
  userName = 'Usuario',
  userEmail = 'correo@hotel.com'
}: {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/protected") return pathname === "/protected";
    return pathname.startsWith(href);
  };

  // 1. Filtro de Seguridad: Solo admin ve "Encargados"
  const filteredNavItems = navigationItems.filter(item => {
    const isAdmin = userRole === 'Administrador' || userRole === 'admin';
    if (item.href === '/protected/encargados' && !isAdmin) {
      return false;
    }
    return true;
  });

  // 2. Lógica Visual:
  const esAdmin = userRole === 'Administrador' || userRole === 'admin';
  const labelRol = esAdmin ? 'Administrador' : 'Encargado';

  // CAMBIO AQUÍ: Eliminamos el color azul. Ahora todos usan el mismo gris.
  const colorRol = 'text-muted-foreground font-medium';

  return (
    <aside className="w-64 flex-shrink-0 bg-content-light dark:bg-content-dark hidden lg:flex flex-col border-r border-border-light dark:border-border-dark h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/img/hostify-logo.png"
            alt="Hostify Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        <nav className="flex flex-col gap-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 p-6 border-t border-border-light dark:border-border-dark bg-content-light dark:bg-content-dark z-10">
        <div className="p-4 mb-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            {/* AVATAR: Gris suave para todos */}
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>

            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate text-foreground" title={userName}>
                {userName}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={userEmail}>
                {userEmail}
              </p>
              {/* ROL: Ahora siempre sale en gris */}
              <p className={`text-xs capitalize mt-0.5 ${colorRol}`}>
                {labelRol}
              </p>
            </div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}