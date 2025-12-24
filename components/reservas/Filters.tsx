"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

export default function ReservationsFilters({ statusOptions = [], paymentOptions = [] }: { statusOptions?: string[]; paymentOptions?: string[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentStatus = searchParams.get("status") || "Todos";
  const rawPayment = searchParams.get("payment") || null;

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value || value === "Todos") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const checkedReload = React.useRef(false);

  useEffect(() => {
    if (checkedReload.current) return;
    checkedReload.current = true;

    try {
      const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
      if (nav === "reload") {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.delete("status");
        params.delete("payment");
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
      }
    } catch {
      // ignore
    }
  }, [pathname, router, searchParams]);

  const statusList = statusOptions.length ? ["Todos", ...statusOptions] : ["Todos"];
  // Normalizar valores de opción de pago para que las claves sean consistentes
  const normalizePayment = (p: string) => {
    const v = (p || "")
      .toString()
      .trim()
      .toLowerCase();
    if (v === "paid" || v === "pagado") return "paid";
    if (v === "pagada" || v === "pending" || v === "pendiente") return "pending";
    if (v === "partial" || v === "parcial" || v === "abonado") return "partial";
    // Evaluar refunded ANTES que refund_pending para evitar falsos positivos
    if (v === "refunded" || v === "devuelto" || (v.includes("devoluci") && v.includes("ok"))) return "refunded";
    if (v === "refund_pending" || v.includes("reembolso") || (v.includes("devoluci") && v.includes("proceso"))) return "refund_pending";
    return v || "pending";
  };

  const mappedPayments = paymentOptions.map(normalizePayment);
  const uniquePayments = new Set(mappedPayments.filter(Boolean));

  // Orden específico para estados de pago
  const paymentOrder = ["paid", "partial", "pending", "refunded", "refund_pending"];
  const sortedPayments = paymentOrder.filter(p => uniquePayments.has(p));
  const paymentList = sortedPayments.length ? ["Todos", ...sortedPayments] : ["Todos"];
  const currentPayment = rawPayment ? normalizePayment(rawPayment) : "Todos";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-border-light dark:border-border-dark bg-transparent text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
        <Filter size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} className="w-[28rem]">
        <div className="p-2 grid grid-cols-2 gap-4">
          <div>
            <DropdownMenuLabel inset>Status de reserva</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={currentStatus} onValueChange={(v) => setParam("status", v)}>
              {statusList.map((opt) => (
                <DropdownMenuRadioItem key={opt} value={opt}>
                  {opt}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>

          <div>
            <DropdownMenuLabel inset>Estado de pago</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={currentPayment} onValueChange={(v) => setParam("payment", v)}>
              {paymentList.map((opt) => (
                <DropdownMenuRadioItem key={opt} value={opt}>
                  {opt === "paid" ? "Pagado" : opt === "partial" ? "Abonado" : opt === "pending" ? "Pendiente" : opt === "refund_pending" ? "Devolución proceso" : opt === "refunded" ? "Devolución Ok" : opt}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>
        </div>
        <div className="px-3 pb-3 pt-1">
          <button
            onClick={() => {
              const params = new URLSearchParams(Array.from(searchParams.entries()));
              params.delete("status");
              params.delete("payment");
              const qs = params.toString();
              router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
              setOpen(false);
            }}
            className="w-full text-sm text-center px-3 py-2 rounded-md bg-transparent border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Limpiar filtros
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
