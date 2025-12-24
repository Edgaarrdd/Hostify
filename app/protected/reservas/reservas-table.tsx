"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Trash2,
  ChevronDown,
  Eye, // --- Ícono para "Ver"
  // --- [IA] IMPORTACIONES AGREGADAS ---
  MessageSquare,
  Loader2,
  Wifi
} from "lucide-react";
import { toast } from "sonner"; // --- [IA] Para notificaciones
import { cancelReservation } from "@/lib/actions/reservations";
import { sendWhatsAppMessage } from "@/lib/services/whatsapp/ai-concierge"; // --- [IA] Tu cerebro
import { PaginatedTable } from "@/components/PaginatedTable";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface Reservation {
  id: string;
  reservation_code: string | null;
  check_in: string;
  check_out: string;
  cantidad_noches: number;
  total: number;
  payment_status: string;
  status: string;
  deposit_amount: number | null;
  guests: {
    nombre: string;
    apellido: string;
    email: string;
    // --- [IA] CAMPOS NECESARIOS AGREGADOS ---
    telefono: string;
    pais_origen: string;
  } | null;
  rooms: {
    number: string;
    type: string;
  } | null;
}

//  Helper seguro: Corta el string para no cambiar la zona horaria
function formatDateVisual(dateStr: string) {
  if (!dateStr) return "-";
  const rawDate = dateStr.split('T')[0];
  const [, month, day] = rawDate.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const monthName = months[parseInt(month) - 1] || "";
  return `${day} ${monthName}`;
}

export function ReservasTable({ initialReservations, query, initialStatusFilter, initialPaymentFilter }: { initialReservations: Reservation[]; query: string; initialStatusFilter?: string; initialPaymentFilter?: string }) {
  const [reservations, setReservations] = useState(initialReservations);
  const [statusFilter, setStatusFilter] = useState<'Todos' | string>(initialStatusFilter || 'Todos');
  const [paymentFilter, setPaymentFilter] = useState<'Todos' | string>(initialPaymentFilter || 'Todos');

  // --- [IA] ESTADO DE CARGA ---
  const [listeningId, setListeningId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusParam = searchParams?.get("status") || undefined;
  const paymentParam = searchParams?.get("payment") || undefined;

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams?.entries() || []));
    if (!value || value === "Todos") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  // reaccionar a cambios de parámetros del lado del cliente (router.replace/push desde Filters)
  useEffect(() => {
    if (statusParam === null || statusParam === undefined) {
      setStatusFilter('Todos');
    } else {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  useEffect(() => {
    if (paymentParam === null || paymentParam === undefined) {
      setPaymentFilter('Todos');
    } else {
      setPaymentFilter(paymentParam);
    }
  }, [paymentParam]);

  useEffect(() => {
    setReservations(initialReservations);
  }, [initialReservations]);

  // Sincronizar con parámetros externos cuando la página los actualiza
  useEffect(() => {
    if (initialStatusFilter !== undefined) setStatusFilter(initialStatusFilter || 'Todos');
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialPaymentFilter !== undefined) setPaymentFilter(initialPaymentFilter || 'Todos');
  }, [initialPaymentFilter]);

  const handleCancelReservation = async (reservationId: string) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
      try {
        await cancelReservation(reservationId);
        setReservations(reservations.filter(r => r.id !== reservationId));
      } catch (err) {
        console.error("Error al cancelar reserva:", err);
        alert("Error al cancelar la reserva");
      }
    }
  };

  // --- [IA] TU FUNCIÓN DE WHATSAPP INYECTADA ---
  const handleWhatsAppClick = async (res: Reservation) => {
    const telefono = res.guests?.telefono;
    const pais = res.guests?.pais_origen || "Chile";

    if (!telefono) { toast.error("Sin teléfono registrado"); return; }
    setListeningId(res.id);

    let messageType: "reminder" | "checkin" | "checkout" = "reminder";
    let actionLabel = "Recordatorio";

    if (res.status === 'Check-in') { messageType = "checkin"; actionLabel = "Bienvenida + Wifi"; }
    else if (res.status === 'Finalizada') { messageType = "checkout"; actionLabel = "Despedida"; }

    toast.info(` Enviando ${actionLabel}...`);

    try {
      const result = await sendWhatsAppMessage(
        messageType,
        `${res.guests?.nombre} ${res.guests?.apellido}`,
        telefono,
        res.rooms?.number || "S/N",
        pais
      );
      if (result.success) {
        toast.success(` ${actionLabel} enviado.`);
        setListeningId(null);
      } else {
        toast.error("Error al enviar");
        setListeningId(null);
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setListeningId(null);
    }
  };

  // Normalizar valor de pago para comparación (definido antes de columns para evitar problemas de hoisting)
  const normalizePayment = (p: string) => {
    const v = (p || "").toString().trim().toLowerCase();
    if (v === "paid" || v === "pagado") return "paid";
    if (v === "pagada" || v === "pending" || v === "pendiente") return "pending";
    if (v === "partial" || v === "parcial" || v === "abonado") return "partial";
    // Evaluar refunded ANTES que refund_pending para evitar falsos positivos
    if (v === "refunded" || v === "devuelto" || (v.includes("devoluci") && v.includes("ok"))) return "refunded";
    if (v === "refund_pending" || v.includes("reembolso") || (v.includes("devoluci") && v.includes("proceso"))) return "refund_pending";
    if (v === "retained" || v.includes("retenido")) return "retained";
    return v || "pending";
  };

  const columns = [
    {
      key: "reservation_code",
      label: "N° RESERVA",
      render: (value: unknown, row: Reservation) => (
        <span className="font-mono text-primary font-bold">
          <Link href={`/protected/reservas/${row.id}`} className="hover:underline">
            {(value as string | null) || "N/A"}
          </Link>
        </span>
      ),
    },
    {
      key: "guests",
      label: "Responsable",
      render: (_: unknown, row: Reservation) => (
        <>
          <div className="text-sm font-medium text-foreground">
            {row.guests?.nombre} {row.guests?.apellido}
          </div>
          <div className="text-sm text-muted-foreground">{row.guests?.email}</div>
        </>
      ),
    },
    {
      key: "rooms",
      label: "Habitación",
      render: (_: unknown, row: Reservation) => (
        <div className="text-sm">
          <div className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900">
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              {row.rooms?.number}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            ({row.rooms?.type})
          </div>
        </div>
      ),
    },
    {
      key: "check_in",
      label: "Fechas",
      sortable: true,
      render: (_: unknown, row: Reservation) => (
        <div className="text-sm text-subtext-light dark:text-subtext-dark">
          <div>In: {formatDateVisual(row.check_in)}</div>
          <div>Out: {formatDateVisual(row.check_out)}</div>
          <div className="text-xs text-muted-foreground">({row.cantidad_noches} noches)</div>
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-foreground">
          {(value as number)?.toLocaleString("es-CL")}
        </span>
      ),
    },
    {
      key: "status",
      label: (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1 hover:text-primary">
            ESTADO <ChevronDown size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setParam("status", v); }}>
              <DropdownMenuRadioItem value="Todos">Todos</DropdownMenuRadioItem>
              {Array.from(new Set(reservations.map(r => r.status))).filter(Boolean).map((opt) => (
                <DropdownMenuRadioItem key={opt} value={opt}>{opt}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      render: (_: unknown, row: Reservation) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Cancelada'
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : row.status === 'Confirmada' || row.status === 'Check-in' || row.status === 'Finalizada'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "payment_status",
      label: (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1 hover:text-primary">
            ESTADO PAGO <ChevronDown size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setParam("payment", v); }}>
              <DropdownMenuRadioItem value="Todos">Todos</DropdownMenuRadioItem>
              {(() => {
                const mappedPayments = reservations.map(r => normalizePayment(r.payment_status));
                const uniquePayments = new Set(mappedPayments.filter(Boolean));
                const paymentOrder = ["paid", "partial", "retained", "pending", "refunded", "refund_pending"];
                const sortedPayments = paymentOrder.filter(p => uniquePayments.has(p));
                return sortedPayments.map((opt) => (
                  <DropdownMenuRadioItem key={opt} value={opt}>
                    {opt === "paid" ? "Pagado" : opt === "partial" ? "Abonado" : opt === "pending" ? "Pendiente" : opt === "refund_pending" ? "Devolución proceso" : opt === "refunded" ? "Devolución Ok" : opt === "retained" ? "Abono Retenido" : opt}
                  </DropdownMenuRadioItem>
                ));
              })()}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      render: (_: unknown, row: Reservation) => (
        <>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.payment_status === 'paid'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : row.payment_status === 'partial'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : row.payment_status === 'refund_pending'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                : row.payment_status === 'refunded'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  : row.payment_status === 'retained'
                    ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
            {row.payment_status === 'paid'
              ? 'Pagado'
              : row.payment_status === 'partial'
                ? 'Abonado'
                : row.payment_status === 'refund_pending'
                  ? 'Devolución proceso'
                  : row.payment_status === 'refunded'
                    ? 'Devolución Ok'
                    : row.payment_status === 'retained'
                      ? 'Abono Retenido'
                      : 'Pendiente'}
          </span>
          {row.payment_status === 'partial' && (
            <div className="text-xs text-muted-foreground mt-1">
              Abono: ${row.deposit_amount?.toLocaleString("es-CL")}
            </div>
          )}
        </>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_: unknown, row: Reservation) => (
        <div className="flex items-center gap-2">

          {/* --- [IA] BOTÓN INYECTADO DISCRETAMENTE --- */}
          {row.status !== 'Cancelada' && (
            <button
              onClick={() => handleWhatsAppClick(row)}
              disabled={listeningId === row.id}
              className={`p-1.5 rounded transition-all border ${row.status === 'Check-in' ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800"
                : row.status === 'Finalizada' ? "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:border-purple-800"
                  : listeningId === row.id ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                    : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-800"
                }`}
              title="Enviar mensaje IA"
            >
              {listeningId === row.id ? <Loader2 className="animate-spin" size={16} /> :
                row.status === 'Check-in' ? <Wifi size={16} /> :
                  <MessageSquare size={16} />}
            </button>
          )}

          <Link
            href={`/protected/reservas/${row.id}`}
            className="text-primary hover:text-primary/80 transition-colors p-1 hover:bg-primary/10 rounded"
            title="Ver detalles"
          >
            <Eye size={18} />
          </Link>

          {row.status !== 'Cancelada' && (
            <button
              onClick={() => handleCancelReservation(row.id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              title="Eliminar reserva"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Construir lista derivada aplicando filtros de estado + pago
  const displayed = reservations.filter((r) => {
    const statusOk = statusFilter === 'Todos' ? true : r.status === statusFilter;
    const normalizedPayment = normalizePayment(r.payment_status);
    const normalizedFilter = paymentFilter === 'Todos' ? 'Todos' : normalizePayment(paymentFilter);
    const paymentOk = normalizedFilter === 'Todos' ? true : normalizedPayment === normalizedFilter;
    return statusOk && paymentOk;
  });

  return (
    <PaginatedTable
      data={displayed}
      columns={columns}
      itemsPerPage={10}
      emptyMessage={`No se encontraron reservas${query ? " que coincidan con tu búsqueda" : ""}.`}
      rowClassName={(row) => `transition-colors ${row.status === 'Cancelada' ? 'bg-gray-100 dark:bg-muted/50 opacity-75' : 'hover:bg-gray-50 dark:hover:bg-muted/20'}`}
    />
  );
}


