"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Chart, { Chart as ChartJS } from "chart.js/auto";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Spanish } from "flatpickr/dist/l10n/es.js";

const supabase = createClient();

// ───────────── Tipos ─────────────

type Room = {
    id: string;
    number: string;
    type: string;
    status: string;
};

type Reservation = {
    id: string;
    huesped_titular_id: string | null;
    room_id: string | null;
    check_in: string | null;
    check_out: string | null;
    status: string | null;
    actual_check_in?: string | null;
    actual_check_out?: string | null;
    total?: number | null;
    deposit_amount?: number | null;
    payment_status?: string | null;
    payment_type?: string | null;
    subtotal?: number | null;
    iva_amount?: number | null;
};

type Guest = {
    id: string;
    nombre: string | null;
    numero_documento?: string | null;
};

const MONTH_LABELS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ───────────── Helpers ─────────────



// Convertimos "2025-12-12T00:00:00.000Z" a "12/12/2025"
function formatDateVisual(dateStr: string | null) {
    if (!dateStr) return "-";
    const rawDate = dateStr.split('T')[0];
    const [year, month, day] = rawDate.split("-");
    return `${day}/${month}/${year}`;
}
// Convertimos "2025-12-12" a "12-12-2025"
function formatLocalYMDToVisual(ymd: string | null) {
    if (!ymd) return "";
    const [year, month, day] = ymd.split("-");
    return `${day}-${month}-${year}`;
}

// Convierte Date a "YYYY-MM-DD"
function toYMD(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getEffectiveCheckInDate(r: Reservation): string {
    const raw = r.actual_check_in || r.check_in || "";
    return raw.split('T')[0];
}

function getEffectiveCheckOutDate(r: Reservation): string {
    const raw = r.actual_check_out || r.check_out || "";
    return raw.split('T')[0];
}

function getRoomStats(rooms: Room[]) {
    const normalized = (status: string | undefined) => status?.toLowerCase() || "";
    const occupied = rooms.filter((r) => normalized(r.status) === "ocupada").length;
    const available = rooms.filter((r) => normalized(r.status) === "disponible").length;
    const total = rooms.length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { occupied, available, total, occupancyRate };
}

function isBetweenYMD(valueYMD: string, startYMD: string, endYMD: string) {
    return valueYMD >= startYMD && valueYMD <= endYMD;
}

function normalizeStatus(status: string | null | undefined) {
    return (status || "").toLowerCase().trim();
}

// ───────────── Lógica de Filtros ─────────────

// Calcula ingresos de reservas en un rango de fechas
function calculateRevenue(reservations: Reservation[], startYMD: string | null, endYMD: string | null) {
    if (!startYMD) return {
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        depositAmount: 0,
        fullPayments: 0,
        partialPayments: 0,
        reservationsCount: 0
    };

    const end = endYMD ?? startYMD;
    const filteredReservations = reservations.filter((r) => {
        if (normalizeStatus(r.status) === "cancelada") return false;
        const ymd = getEffectiveCheckInDate(r);
        return isBetweenYMD(ymd, startYMD, end);
    });

    let totalRevenue = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let depositAmount = 0;
    let fullPayments = 0;
    let partialPayments = 0;

    filteredReservations.forEach((r) => {
        const total = r.total || 0;
        const deposit = r.deposit_amount || 0;
        const paymentStatus = (r.payment_status || '').toLowerCase();

        totalRevenue += total;

        if (paymentStatus === 'paid') {
            paidAmount += total;
            fullPayments++;
        } else if (paymentStatus === 'partial') {
            paidAmount += deposit;
            pendingAmount += (total - deposit);
            depositAmount += deposit;
            partialPayments++;
        }
    });

    return {
        totalRevenue,
        paidAmount,
        pendingAmount,
        depositAmount,
        fullPayments,
        partialPayments,
        reservationsCount: filteredReservations.length
    };
}

function getReservationsForRange(reservations: Reservation[], startYMD: string | null, endYMD: string | null) {
    if (!startYMD) return [];
    const end = endYMD ?? startYMD;

    return [...reservations]
        .filter((r) => {
            if (normalizeStatus(r.status) === "cancelada") return false;
            const ymd = getEffectiveCheckInDate(r);
            return isBetweenYMD(ymd, startYMD, end);
        })
        .sort((a, b) => getEffectiveCheckInDate(a).localeCompare(getEffectiveCheckInDate(b)));
}

// Cuenta check-ins y check-outs en el rango
function countForRange(reservations: Reservation[], startYMD: string | null, endYMD: string | null) {
    if (!startYMD) return { checkins: 0, checkouts: 0 };
    const end = endYMD ?? startYMD;

    const checkins = reservations.filter((r) => {
        if (normalizeStatus(r.status) === "cancelada") return false;
        const ymd = getEffectiveCheckInDate(r);
        return isBetweenYMD(ymd, startYMD, end);
    }).length;

    const checkouts = reservations.filter((r) => {
        if (normalizeStatus(r.status) === "cancelada") return false;
        const ymd = getEffectiveCheckOutDate(r);
        return isBetweenYMD(ymd, startYMD, end);
    }).length;

    return { checkins, checkouts };
}

// Escapa valores para CSV

function toCsvCell(value: unknown) {
    const str = String(value ?? "");
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
}

// ───────────── Hook de datos ─────────────

function useReportData() {
    const [role, setRole] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchAll = async () => {
            if (!isMounted) return;
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!isMounted) return;
                setRole(user?.app_metadata?.role || user?.user_metadata?.role || null);

                const { data: roomsData } = await supabase.from("rooms").select("id, number, type, status");
                const { data: reservationsData } = await supabase.from("reservations").select("id, huesped_titular_id, room_id, check_in, check_out, actual_check_in, actual_check_out, status, total, deposit_amount, payment_status, payment_type, subtotal, iva_amount");
                const { data: guestsData } = await supabase.from("guests").select("id, nombre, numero_documento");

                if (!isMounted) return;
                setRooms((roomsData as Room[]) || []);
                setReservations((reservationsData as Reservation[]) || []);
                setGuests((guestsData as Guest[]) || []);
            } catch (error) {
                console.error("Error inesperado cargando datos de reportes:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchAll();
        const channel = supabase.channel("reportes-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchAll)
            .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, fetchAll)
            .subscribe();
        return () => { isMounted = false; supabase.removeChannel(channel); };
    }, []);
    return { role, rooms, reservations, guests, loading };
}

// ───────────── Componente Principal ─────────────

export default function Reportes() {
    const { role, rooms, reservations, guests, loading } = useReportData();
    const [dateRange, setDateRange] = useState<Date[] | null>(null);
    const [activeReport, setActiveReport] = useState<'general' | 'ingresos'>('general');
    const roomStatusCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const occupancyCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const revenueCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const roomStatusChartRef = useRef<ChartJS | null>(null);
    const occupancyChartRef = useRef<ChartJS | null>(null);
    const revenueChartRef = useRef<ChartJS | null>(null);
    const [todayStr, setTodayStr] = useState<string | null>(null);
    const isAdmin = role === "admin";

    useEffect(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        setTodayStr(`${yyyy}-${mm}-${dd}`);
    }, []);

    const { filterStartYMD, filterEndYMD } = useMemo(() => {
        if (isAdmin && dateRange && dateRange.length > 0) {
            const start = toYMD(dateRange[0]);
            const end = dateRange[1] ? toYMD(dateRange[1]) : null;
            return { filterStartYMD: start, filterEndYMD: end };
        }
        return { filterStartYMD: todayStr, filterEndYMD: null };
    }, [isAdmin, dateRange, todayStr]);

    const roomsById = useMemo(() => {
        const map = new Map<string, Room>();
        rooms.forEach((r) => map.set(r.id, r));
        return map;
    }, [rooms]);

    const guestsById = useMemo(() => {
        const map = new Map<string, Guest>();
        guests.forEach((g) => map.set(g.id, g));
        return map;
    }, [guests]);

    const { occupied, available, total, occupancyRate } = useMemo(() => getRoomStats(rooms), [rooms]);
    const { checkins, checkouts } = useMemo(() => countForRange(reservations, filterStartYMD, filterEndYMD), [reservations, filterStartYMD, filterEndYMD]);
    const filteredReservations = useMemo(() => getReservationsForRange(reservations, filterStartYMD, filterEndYMD), [reservations, filterStartYMD, filterEndYMD]);
    const revenueData = useMemo(() => calculateRevenue(reservations, filterStartYMD, filterEndYMD), [reservations, filterStartYMD, filterEndYMD]);

    function getGuestNameForReservation(r: Reservation): string {
        if (!r.huesped_titular_id) return "Sin nombre";
        const guest = guestsById.get(r.huesped_titular_id);
        return guest?.nombre || "Sin nombre";
    }

    function getGuestRutForReservation(r: Reservation): string {
        if (!r.huesped_titular_id) return "-";
        const guest = guestsById.get(r.huesped_titular_id);
        return guest?.numero_documento || "-";
    }

    function getRoomNumber(roomId: string | null): string {
        if (!roomId) return "-";
        const room = roomsById.get(roomId);
        return room?.number ?? "-";
    }

    // Descargar CSV

    const handleDownloadReports = () => {
        const rowsSource = filteredReservations;
        const headers = ["Huésped", "RUT", "Check-in", "Check-out", "Habitación", "Estado"];
        const rows = rowsSource.map((r) => [
            getGuestNameForReservation(r),
            getGuestRutForReservation(r),
            formatDateVisual(getEffectiveCheckInDate(r)),
            formatDateVisual(getEffectiveCheckOutDate(r)),
            getRoomNumber(r.room_id),
            r.status || "",
        ]);
        const start = filterStartYMD ?? "sin_fecha";
        const end = filterEndYMD ?? "";
        const periodo = end ? `${formatLocalYMDToVisual(start)} a ${formatLocalYMDToVisual(end)}` : formatLocalYMDToVisual(start);
        const suffix = end ? `${start}_a_${end}` : start;
        const summaryLines = [
            "Resumen general",
            `Periodo;${periodo}`,
            `Ocupación actual;${occupancyRate}%`,
            `Habitaciones ocupadas;${occupied}`,
            `Habitaciones disponibles;${available}`,
            `Check-ins;${checkins}`,
            `Check-outs;${checkouts}`,
            "",
        ];
        const csvLines = [...summaryLines, headers.join(";"), ...rows.map((row) => row.map(toCsvCell).join(";"))];
        const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `reportes_hotel_${suffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    // Gráfico de estado de habitaciones
    useEffect(() => {
        if (!roomStatusCanvasRef.current || !rooms.length) return;
        const ctx = roomStatusCanvasRef.current.getContext("2d");
        if (!ctx) return;
        roomStatusChartRef.current?.destroy();
        roomStatusChartRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Ocupadas", "Disponibles"],
                datasets: [{ data: [occupied, available], backgroundColor: ["#13a4ec", "#22c55e"], hoverOffset: 4 }],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
        });
        return () => roomStatusChartRef.current?.destroy();
    }, [rooms, occupied, available]);

    // Gráfico de ocupación mensual (solo admin)
    useEffect(() => {
        if (!isAdmin || !occupancyCanvasRef.current) return;
        const ctx = occupancyCanvasRef.current.getContext("2d");
        if (!ctx) return;
        occupancyChartRef.current?.destroy();
        const monthlyCounts = new Array(12).fill(0);
        reservations.forEach((r) => {
            if (normalizeStatus(r.status) === "cancelada") return;
            const dateStr = getEffectiveCheckInDate(r);
            if (!dateStr) return;
            const month = new Date(dateStr).getMonth();
            if (!Number.isNaN(month)) monthlyCounts[month] += 1;
        });
        occupancyChartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels: MONTH_LABELS,
                datasets: [{ label: "Reservas por mes", data: monthlyCounts, fill: true, backgroundColor: "rgba(19, 164, 236, 0.2)", borderColor: "#13a4ec", tension: 0.4 }],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
        });
        return () => occupancyChartRef.current?.destroy();
    }, [isAdmin, reservations]);

    // Gráfico de ingresos (solo para reporte de ingresos)
    useEffect(() => {
        if (activeReport !== 'ingresos' || !revenueCanvasRef.current) return;
        const ctx = revenueCanvasRef.current.getContext("2d");
        if (!ctx) return;
        revenueChartRef.current?.destroy();

        const monthlyRevenue = new Array(12).fill(0);
        reservations.forEach((r) => {
            if (normalizeStatus(r.status) === "cancelada") return;
            const dateStr = getEffectiveCheckInDate(r);
            if (!dateStr) return;
            const month = new Date(dateStr).getMonth();
            if (!Number.isNaN(month)) {
                monthlyRevenue[month] += (r.total || 0);
            }
        });

        revenueChartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: MONTH_LABELS,
                datasets: [{
                    label: "Ingresos por mes",
                    data: monthlyRevenue,
                    backgroundColor: "rgba(34, 197, 94, 0.7)",
                    borderColor: "#22c55e",
                    borderWidth: 1
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `$${(context.parsed.y ?? 0).toLocaleString('es-CL')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return `$${Number(value).toLocaleString('es-CL')}`;
                            }
                        }
                    }
                }
            },
        });
        return () => revenueChartRef.current?.destroy();
    }, [activeReport, reservations]);

    // ───────────── Componentes UI ─────────────

    return (
        <main className="flex-1 p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold">{isAdmin ? "Bienvenido, Administrador - Reportes" : "Bienvenido, Encargado - Reportes"}</h2>
                        <p className="text-slate-500 mt-1">Panel de control del Hotel Duerme Bien.</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {isAdmin && (
                            <div className="hidden md:block">
                                <Flatpickr className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-800" options={{ mode: "range", dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", locale: Spanish }} placeholder="Filtrar por fechas" value={dateRange || []} onChange={(dates) => setDateRange(dates as Date[])} />
                            </div>
                        )}
                        <button onClick={handleDownloadReports} className="flex items-center gap-2 h-10 px-4 rounded bg-[#13a4ec] text-white font-semibold shadow-sm hover:bg-[#0f8bc5] transition-colors">
                            <span>{filterStartYMD ? (filterEndYMD ? "Descargar (Rango)" : "Descargar (Fecha)") : "Descargar"}</span>
                        </button>
                    </div>
                </div>

                {/* Pestañas de navegación entre reportes */}
                <div className="flex gap-2 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => setActiveReport('general')}
                        className={`px-4 py-2 font-semibold transition-colors ${activeReport === 'general' ? 'border-b-2 border-[#13a4ec] text-[#13a4ec]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Reporte General
                    </button>
                    <button
                        onClick={() => setActiveReport('ingresos')}
                        className={`px-4 py-2 font-semibold transition-colors ${activeReport === 'ingresos' ? 'border-b-2 border-[#22c55e] text-[#22c55e]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Reporte de Ingresos
                    </button>
                </div>

                {/* Contenido del reporte general */}
                {activeReport === 'general' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            <SummaryCard title="Ocupación Actual" value={`${occupancyRate}%`} subtitle={`${occupied} de ${total} habitaciones ocupadas`} accentColor="#13a4ec" />
                            <SummaryCard title={filterEndYMD ? "Check-ins (Rango)" : "Check-ins (Fecha)"} value={checkins.toString()} subtitle="Llegadas válidas" accentColor="#22c55e" />
                            <SummaryCard title={filterEndYMD ? "Check-outs (Rango)" : "Check-outs (Fecha)"} value={checkouts.toString()} subtitle="Salidas válidas" accentColor="#ef4444" />
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                            {isAdmin && <ChartCard title="Tendencia de Reservas Mensuales"><canvas ref={occupancyCanvasRef} /></ChartCard>}
                            <ChartCard title="Estado de Habitaciones"><canvas ref={roomStatusCanvasRef} /></ChartCard>
                        </div>
                        <div className="bg-white dark:bg-background-dark rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold mb-6">{filterStartYMD ? filterEndYMD ? `Reservas según check-in (${formatLocalYMDToVisual(filterStartYMD)} a ${formatLocalYMDToVisual(filterEndYMD)})` : `Reservas según check-in (${formatLocalYMDToVisual(filterStartYMD)})` : "Reservas"}</h3>
                            {loading ? <p className="text-slate-500 text-sm">Cargando datos...</p> : filteredReservations.length === 0 ? <p className="text-slate-500 text-sm">No hay reservas válidas para el período seleccionado.</p> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 font-semibold">Huésped</th>
                                                <th className="p-3 font-semibold">RUT</th>
                                                <th className="p-3 font-semibold">Check-in</th>
                                                <th className="p-3 font-semibold">Check-out</th>
                                                <th className="p-3 font-semibold">Habitación</th>
                                                <th className="p-3 font-semibold text-right">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReservations.map((r) => (
                                                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                                                    <td className="p-3">{getGuestNameForReservation(r)}</td>
                                                    <td className="p-3 text-sm text-slate-500">{getGuestRutForReservation(r)}</td>
                                                    <td className="p-3 text-slate-500">{formatDateVisual(getEffectiveCheckInDate(r))}</td>
                                                    <td className="p-3 text-slate-500">{formatDateVisual(getEffectiveCheckOutDate(r))}</td>
                                                    <td className="p-3 text-slate-500">{getRoomNumber(r.room_id)}</td>
                                                    <td className="p-3 text-right">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${normalizeStatus(r.status) === 'cancelada' ? 'bg-red-100 text-red-700' : normalizeStatus(r.status) === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                                            {r.status ?? "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Contenido del reporte de ingresos */}
                {activeReport === 'ingresos' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                            <SummaryCard
                                title="Ingresos Totales"
                                value={`$${revenueData.totalRevenue.toLocaleString('es-CL')}`}
                                subtitle={`${revenueData.reservationsCount} reservas`}
                                accentColor="#22c55e"
                            />
                            <SummaryCard
                                title="Pagado"
                                value={`$${revenueData.paidAmount.toLocaleString('es-CL')}`}
                                subtitle={`${revenueData.fullPayments} pago(s) completo(s)`}
                                accentColor="#10b981"
                            />
                            <SummaryCard
                                title="Pendiente"
                                value={`$${revenueData.pendingAmount.toLocaleString('es-CL')}`}
                                subtitle={`${revenueData.partialPayments} pago(s) parcial(es)`}
                                accentColor="#f59e0b"
                            />
                            <SummaryCard
                                title="Depósitos"
                                value={`$${revenueData.depositAmount.toLocaleString('es-CL')}`}
                                subtitle="Anticipos recibidos"
                                accentColor="#3b82f6"
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 mb-8">
                            <ChartCard title="Ingresos Mensuales">
                                <canvas ref={revenueCanvasRef} />
                            </ChartCard>
                        </div>

                        <div className="bg-white dark:bg-background-dark rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold mb-6">
                                {filterStartYMD ? filterEndYMD
                                    ? `Detalle de Ingresos (${formatLocalYMDToVisual(filterStartYMD)} a ${formatLocalYMDToVisual(filterEndYMD)})`
                                    : `Detalle de Ingresos (${formatLocalYMDToVisual(filterStartYMD)})`
                                    : "Detalle de Ingresos"}
                            </h3>
                            {loading ? (
                                <p className="text-slate-500 text-sm">Cargando datos...</p>
                            ) : filteredReservations.length === 0 ? (
                                <p className="text-slate-500 text-sm">No hay reservas válidas para el período seleccionado.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 font-semibold">Huésped</th>
                                                <th className="p-3 font-semibold">Check-in</th>
                                                <th className="p-3 font-semibold">Habitación</th>
                                                <th className="p-3 font-semibold text-right">Total</th>
                                                <th className="p-3 font-semibold text-right">Pagado</th>
                                                <th className="p-3 font-semibold text-right">Pendiente</th>
                                                <th className="p-3 font-semibold text-center">Estado Pago</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReservations.map((r) => {
                                                const total = r.total || 0;
                                                const deposit = r.deposit_amount || 0;
                                                const paymentStatus = (r.payment_status || '').toLowerCase();
                                                const paid = paymentStatus === 'paid' ? total : deposit;
                                                const pending = paymentStatus === 'paid' ? 0 : (total - deposit);

                                                return (
                                                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                                                        <td className="p-3">{getGuestNameForReservation(r)}</td>
                                                        <td className="p-3 text-slate-500">{formatDateVisual(getEffectiveCheckInDate(r))}</td>
                                                        <td className="p-3 text-slate-500">{getRoomNumber(r.room_id)}</td>
                                                        <td className="p-3 text-right font-semibold">${total.toLocaleString('es-CL')}</td>
                                                        <td className="p-3 text-right text-green-600">${paid.toLocaleString('es-CL')}</td>
                                                        <td className="p-3 text-right text-orange-600">${pending.toLocaleString('es-CL')}</td>
                                                        <td className="p-3 text-center">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatus === 'paid'
                                                                ? 'bg-green-100 text-green-700'
                                                                : paymentStatus === 'partial'
                                                                    ? 'bg-orange-100 text-orange-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                {paymentStatus === 'paid' ? 'Pagado' : paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="border-t-2 border-slate-300 font-bold">
                                            <tr>
                                                <td className="p-3" colSpan={3}>TOTALES</td>
                                                <td className="p-3 text-right">${revenueData.totalRevenue.toLocaleString('es-CL')}</td>
                                                <td className="p-3 text-right text-green-600">${revenueData.paidAmount.toLocaleString('es-CL')}</td>
                                                <td className="p-3 text-right text-orange-600">${revenueData.pendingAmount.toLocaleString('es-CL')}</td>
                                                <td className="p-3"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

// ───────────── Componentes UI ─────────────

interface SummaryCardProps {
    title: string;
    value: string;
    subtitle: string;
    accentColor: string;
}

function SummaryCard({ title, value, subtitle, accentColor }: SummaryCardProps) {
    return (
        <div className="bg-white dark:bg-background-dark rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-3xl font-bold" style={{ color: accentColor }}>{value}</p>
            <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
    );
}

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

// Componente para tarjetas de gráficos
function ChartCard({ title, children }: ChartCardProps) {
    return (
        <div className="bg-white dark:bg-background-dark rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <div className="h-80">{children}</div>
        </div>
    );
}
