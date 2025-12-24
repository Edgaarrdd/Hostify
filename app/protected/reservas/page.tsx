import Link from "next/link";
import { Suspense } from "react";
import { getReservations } from "@/lib/actions/reservations";
import Search from "@/components/ui/search";
import { ReservasTable } from "./reservas-table";

// Actualizamos la interfaz para que coincida con la de la Tabla
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
        telefono: string;
        pais_origen: string; // <--- ¡ESTO FALTABA! (La clave del error rojo)
    } | null;
    rooms: {
        number: string;
        type: string;
    } | null;
}

export default function ReservasPage(props: {
    searchParams: ({ query?: string; status?: string; payment?: string }) | Promise<{ query?: string; status?: string; payment?: string }>;
}) {
    return (
        <div className="space-y-8">
            <div>
                <h1>Reservas</h1>
                <p>Gestión de reservas del hotel</p>
            </div>
            <div className="flex justify-between items-center bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark">
                <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    Administra las próximas entradas y salidas.
                </h3>
                <Link
                    href="/protected/reservas/nueva"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-block"
                >
                    + Agregar reserva
                </Link>
            </div>
            <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Cargando reservas...</div>}>
                <ReservationsLoader searchParams={props.searchParams} />
            </Suspense>
        </div>
    );
}



async function ReservationsLoader({ searchParams }: { searchParams: ({ query?: string; status?: string; payment?: string }) | Promise<{ query?: string; status?: string; payment?: string }> }) {
    const params = await searchParams;
    const query = params?.query || "";
    const status = params?.status || undefined;
    const rawPayment = params?.payment || undefined;

    const normalizePayment = (p?: string) => {
        if (!p) return undefined;
        const v = String(p).trim().toLowerCase();
        if (v === "paid" || v === "pagado") return "paid";
        if (v === "pagada" || v === "pending" || v === "pendiente") return "pending";
        if (v === "partial" || v === "parcial" || v === "abonado") return "partial";
        if (v === "refund_pending" || v.includes("reembolso") || v.includes("refund") || v.includes("devoluci")) return "refund_pending";
        if (v === "refunded" || v === "devuelto") return "refunded";
        return v;
    };

    const payment = normalizePayment(rawPayment as string | undefined) || undefined;

    // TypeScript ahora estará feliz porque la interfaz coincide
    const reservations = await getReservations(query) as unknown as Reservation[];

    return (
        <>
            <div className="mb-6">
                <Search placeholder="Buscar por nombre o habitación" />
            </div>

            <ReservasTable
                initialReservations={reservations}
                query={query}
                initialStatusFilter={status}
                initialPaymentFilter={payment}
            />
        </>
    );
}