"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import { addDays, format, differenceInCalendarDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RoomCard } from "@/components/reservas/room-card";
import { BookingSummary } from "@/components/reservas/booking-summary";

import { getAvailableRooms, Room } from "@/lib/actions/rooms";
import { GuestForm, Guest } from "@/components/reservas/guest-form";
import { validateRut } from "@/lib/utils/rut";
import { isValidEmail } from "@/lib/utils/validation";
import { ReservationSummaryStep } from "@/components/reservas/reservation-summary-step";
import { createReservation } from "@/lib/actions/reservations";

import { fetchServices, Service } from "@/lib/queries/services";

export default function NuevaReservaPage() {
    // Estado para el rango de fechas seleccionado
    const [date, setDate] = useState<DateRange | undefined>();
    // Habitaciones disponibles tras la búsqueda
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Estado para servicios adicionales
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);

    // Control del paso actual del Wizard (1: Fechas, 2: Huéspedes, 3: Servicios, 4: Resumen, 5: Pago, 6: Éxito)
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

    // Almacena la lista de huéspedes por habitación (Key: ID habitación, Value: Array de huéspedes)
    const [guests, setGuests] = useState<Record<string, Guest[]>>({});
    const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);

    const [reservationCode, setReservationCode] = useState("");
    const [reservationId, setReservationId] = useState("");
    const [successEmail, setSuccessEmail] = useState("");

    useEffect(() => {
        setMounted(true);
        setStep(1);
        setGuests({});
        setSelectedRooms([]);
        setReservationCode("");
        setReservationId("");
        setSuccessEmail("");
        setDate({
            from: new Date(),
            to: addDays(new Date(), 2),
        });

        fetchServices().then(setAvailableServices).catch(console.error);
    }, []);

    // Efecto para buscar habitaciones disponibles cada vez que cambian las fechas
    useEffect(() => {
        const fetchRooms = async () => {
            if (date?.from && date?.to) {
                setIsLoading(true);
                try {
                    const rooms = await getAvailableRooms(date.from, date.to);
                    setAvailableRooms(rooms);
                } catch (error) {
                    console.error("Failed to fetch rooms:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setAvailableRooms([]);
            }
        };

        fetchRooms();
    }, [date]);


    const handleRoomSelect = (room: Room) => {
        setSelectedRooms(prev => {
            const exists = prev.find(r => r.id === room.id);
            if (exists) {
                return prev.filter(r => r.id !== room.id);
            } else {
                return [...prev, room];
            }
        });
    };

    const initializeGuests = () => {
        const newGuests: Record<string, Guest[]> = {};

        selectedRooms.forEach(room => {
            newGuests[room.id] = Array.from({ length: room.capacity }).map(() => ({
                id: Math.random().toString(36).substr(2, 9),
                documentType: "RUT",
                documentNumber: "",
                firstName: "",
                lastName: "",
                birthDate: "",
                country: "",
                city: "",
                email: "",
                phone: "",
                isResponsible: false,
            }));
        });

        setGuests(prev => {
            const merged = { ...newGuests };
            Object.keys(prev).forEach(roomId => {
                if (merged[roomId]) {
                    const prevRoomGuests = prev[roomId];
                    const newRoomGuests = merged[roomId];
                    if (prevRoomGuests.length === newRoomGuests.length) {
                        merged[roomId] = prevRoomGuests;
                    }
                }
            });
            return merged;
        });
    };

    const [formErrors, setFormErrors] = useState<Record<string, Record<string, string>>>({});

    /**
     * Maneja la transición entre pasos del wizard.
     * Realiza validaciones críticas antes de permitir avanzar (ej: validación de datos de huéspedes en el paso 2).
     */
    const handleContinue = () => {
        if (selectedRooms.length === 0) {
            alert("Selecciona al menos una habitación");
            return;
        }

        if (step === 1) {
            // Paso 1 -> 2: Inicializar estructuras de huéspedes vacías según capacidad
            initializeGuests();
            setStep(2);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (step === 2) {
            // Paso 2 -> 3: Validar formulario de huéspedes
            const newErrors: Record<string, Record<string, string>> = {};
            let hasErrors = false;

            // Validar TODOS los huéspedes
            for (const roomId in guests) {
                guests[roomId].forEach((guest) => {
                    const guestErrors: Record<string, string> = {};

                    if (!guest.documentNumber) guestErrors.documentNumber = "El número de documento es obligatorio";
                    if (guest.documentType === "RUT" && guest.documentNumber && !validateRut(guest.documentNumber)) {
                        guestErrors.documentNumber = "RUT inválido";
                    }
                    if (!guest.firstName) guestErrors.firstName = "El nombre es obligatorio";
                    if (!guest.lastName) guestErrors.lastName = "El apellido es obligatorio";
                    if (!guest.country) guestErrors.country = "El país es obligatorio";

                    // Si es responsable, chequeos más estrictos
                    if (guest.isResponsible) {
                        if (!guest.email) guestErrors.email = "El email es obligatorio para el responsable";
                        else if (!isValidEmail(guest.email)) guestErrors.email = "Email inválido";

                        if (!guest.phone) guestErrors.phone = "El teléfono es obligatorio para el responsable";
                    } else {
                        // Chequeos opcionales para otros huéspedes si se provee email
                        if (guest.email && !isValidEmail(guest.email)) {
                            guestErrors.email = "Email inválido";
                        }
                    }

                    if (Object.keys(guestErrors).length > 0) {
                        newErrors[guest.id] = guestErrors;
                        hasErrors = true;
                    }
                });
            }

            // Verificar responsable
            let hasResponsible = false;
            for (const roomId in guests) {
                if (guests[roomId].some(g => g.isResponsible)) {
                    hasResponsible = true;
                    break;
                }
            }

            if (!hasResponsible) {
                alert("Debe seleccionar un pasajero responsable para la reserva.");
                return;
            }

            if (hasErrors) {
                setFormErrors(newErrors);
                alert("Por favor corrija los errores en el formulario para continuar.");
                return;
            }

            setFormErrors({});
            setStep(3);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (step === 3) {
            setStep(4);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const toggleService = (service: Service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            } else {
                return [...prev, service];
            }
        });
    }

    /**
     * Finaliza la reserva.
     * Genera un código único, valida datos finales y llama al Server Action para persistir datos.
     */
    const validateAndSubmit = async (paymentData: { type: 'partial' | 'full'; amount: number; discount?: number }) => {
        setStep(5); // Mostrar estado de carga ("Procesando pago...")
        window.scrollTo({ top: 0, behavior: "smooth" });

        const code = Math.floor(10000000 + Math.random() * 90000000).toString();

        let responsibleGuest: Guest | undefined;
        for (const roomId in guests) {
            const found = guests[roomId].find(g => g.isResponsible);
            if (found) {
                responsibleGuest = found;
                break;
            }
        }

        if (!responsibleGuest || !date?.from || !date?.to) {
            alert("Error: Falta información crítica (Huésped responsable o Fechas).");
            setStep(4);
            return;
        }

        const discountFactor = paymentData.discount ? (1 - paymentData.discount / 100) : 1;
        const discountedTotal = Math.round(totalAmount * discountFactor);

        const roomsToBook = selectedRooms.map(r => ({ id: r.id, price: r.price_base }));

        try {
            const [result] = await Promise.all([
                createReservation({
                    guests,
                    responsibleGuest,
                    selectedRooms: roomsToBook,
                    dateRange: {
                        from: format(date.from, "yyyy-MM-dd"),
                        to: format(date.to, "yyyy-MM-dd")
                    },
                    paymentData: {
                        type: paymentData.type,
                        amount: paymentData.amount,
                        deposit: paymentData.type === 'partial' ? paymentData.amount : 0,
                        total: discountedTotal,
                        discount: paymentData.discount
                    },
                    reservationCode: code,
                    selectedServices: selectedServices.map(s => ({ id: s.id, price: s.price, service: s.service }))
                }),
                new Promise(resolve => setTimeout(resolve, 5000))
            ]);

            if (result.success) {
                setReservationCode(code);
                if (result.data?.id) {
                    setReservationId(result.data.id);
                }
                setSuccessEmail(responsibleGuest.email);
                setStep(6);
            } else {
                alert("Hubo un error al crear la reserva: " + result.error);
                setStep(4);
            }

        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado.");
            setStep(4);
        }
    };

    const handleAddGuest = (roomId: string) => {
        const room = selectedRooms.find(r => r.id === roomId);
        if (!room) return;

        const currentGuests = guests[roomId] || [];
        if (currentGuests.length >= room.capacity) return;

        const newGuest: Guest = {
            id: Math.random().toString(36).substr(2, 9),
            documentType: "RUT",
            documentNumber: "",
            firstName: "",
            lastName: "",
            birthDate: "",
            country: "",
            city: "",
            email: "",
            phone: "",
            isResponsible: false,
        };

        setGuests(prev => ({
            ...prev,
            [roomId]: [...currentGuests, newGuest]
        }));
    };

    const handleRemoveGuest = (roomId: string, index: number) => {
        setGuests(prev => {
            const roomGuests = [...(prev[roomId] || [])];
            roomGuests.splice(index, 1);
            return {
                ...prev,
                [roomId]: roomGuests
            };
        });
    };

    const handleGuestChange = (roomId: string, index: number, field: keyof Guest, value: Guest[keyof Guest]) => {
        setGuests(prev => {
            const roomGuests = [...(prev[roomId] || [])];
            roomGuests[index] = { ...roomGuests[index], [field]: value };
            return { ...prev, [roomId]: roomGuests };
        });
    };

    const handleSetResponsible = (roomId: string, index: number) => {
        setGuests(prev => {
            const newGuests = { ...prev };

            // Reset all responsible
            Object.keys(newGuests).forEach(rId => {
                newGuests[rId] = newGuests[rId].map(g => ({ ...g, isResponsible: false }));
            });

            // Set specific responsible
            newGuests[roomId][index].isResponsible = true;
            return newGuests;
        });
    };

    const nights = date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;

    const totalRoomAmount = selectedRooms.reduce((sum, room) => sum + ((room.price_base || 0) * nights), 0);
    const totalServices = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const totalAmount = totalRoomAmount + totalServices;

    if (!mounted) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (step === 5) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <h2 className="text-2xl font-bold text-primary animate-pulse">Procesando pago...</h2>
                <p className="text-muted-foreground">Por favor no cierres esta ventana.</p>
            </div>
        );
    }

    if (step === 6) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-lg mx-auto text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">¡Pago Exitoso!</h2>
                    <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark">
                        Se ha realizado el pago correctamente.
                    </p>
                </div>

                <div className="bg-card p-6 rounded-xl border shadow-sm w-full space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Datos enviados a:</p>
                        <p className="font-medium text-lg">{successEmail}</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-1">Número de reserva:</p>
                        {reservationId ? (
                            <Link href={`/protected/reservas/${reservationId}`} className="block group">
                                <p className="text-3xl font-mono font-bold tracking-wider text-primary group-hover:underline group-hover:text-primary/80 transition-colors">
                                    {reservationCode}
                                </p>
                                <span className="text-xs text-muted-foreground mt-1 block group-hover:text-primary/70">
                                    Click para ver detalles &rarr;
                                </span>
                            </Link>
                        ) : (
                            <p className="text-3xl font-mono font-bold tracking-wider text-primary">{reservationCode}</p>
                        )}
                    </div>
                </div>

                <Link href="/protected/reservas" className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                    Volver a mis reservas
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: "Reservas", href: "/protected/reservas" },
                    { label: "Nueva Reserva" }
                ]}
            />

            <div>
                <h1 className="text-3xl pb-1 font-bold text-text-light dark:text-text-dark">
                    Nueva Reserva
                </h1>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    {step === 1
                        ? "Selecciona las fechas y las habitaciones para la reserva."
                        : step === 2
                            ? "Ingresa los datos de los huéspedes."
                            : step === 3
                                ? "Selecciona servicios adicionales."
                                : "Revisa el resumen de tu reserva."}
                </p>
            </div>

            <div className={`grid grid-cols-1 ${step === 4 ? "md:grid-cols-1" : "md:grid-cols-3"} gap-8`}>
                <div className={`${step === 4 ? "w-full" : "md:col-span-2"} space-y-8`}>
                    {step === 1 && (
                        <div className="space-y-8">
                            <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark">
                                <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">
                                    1. Selecciona las fechas
                                </h2>
                                <div className="flex flex-col min-[1700px]:flex-row gap-8 items-start">
                                    <div className="bg-background rounded-md border border-border p-4">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from || new Date()}
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={1}
                                            locale={es}
                                            disabled={{ before: startOfDay(new Date()) }}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-[300px]">
                                        {date?.from && date?.to ? (
                                            <div className="space-y-4">
                                                <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm">
                                                    <h3 className="font-semibold text-text-light dark:text-text-dark mb-4 text-lg border-b pb-2">
                                                        Fechas Seleccionadas
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <p className="flex justify-between text-sm">
                                                            <span className="text-subtext-light dark:text-subtext-dark">Desde:</span>
                                                            <span className="font-medium">{format(date.from, "PPP", { locale: es })}</span>
                                                        </p>
                                                        <p className="flex justify-between text-sm">
                                                            <span className="text-subtext-light dark:text-subtext-dark">Hasta:</span>
                                                            <span className="font-medium">{format(date.to, "PPP", { locale: es })}</span>
                                                        </p>
                                                        <div className="pt-2 mt-2 border-t border-dashed border-border-light dark:border-border-dark">
                                                            <p className="text-[#13a4ec] font-bold text-center">
                                                                {format(date.from, "d 'de' MMMM", { locale: es })} - {format(date.to, "d 'de' MMMM", { locale: es })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center p-8 bg-gray-50 dark:bg-accent/10 rounded-xl border border-dashed border-border text-subtext-light dark:text-subtext-dark text-center">
                                                <p>Selecciona una fecha de inicio y fin para continuar.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {date?.from && date?.to ? (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">
                                        2. Habitaciones disponibles
                                    </h2>
                                    {isLoading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            <span className="ml-3 text-subtext-light dark:text-subtext-dark">Cargando habitaciones...</span>
                                        </div>
                                    ) : availableRooms.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {availableRooms.map((room) => (
                                                <RoomCard
                                                    key={room.id}
                                                    room={room}
                                                    isSelected={selectedRooms.some(r => r.id === room.id)}
                                                    onSelect={() => handleRoomSelect(room)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-content-light dark:bg-content-dark rounded-xl border border-dashed border-border-light dark:border-border-dark">
                                            <p className="text-subtext-light dark:text-subtext-dark">
                                                No hay habitaciones disponibles para estas fechas.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-content-light dark:bg-content-dark rounded-xl border border-dashed border-border-light dark:border-border-dark">
                                    <p className="text-subtext-light dark:text-subtext-dark">
                                        Selecciona un rango de fechas para ver las habitaciones disponibles.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4 mb-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm text-subtext-light hover:text-text-light underline"
                                >
                                    &larr; Volver a selección
                                </button>
                            </div>

                            <div className="space-y-8">
                                {selectedRooms.map((room) => (
                                    <div key={room.id} className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark">
                                        <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark flex justify-between">
                                            <span>Habitación {room.number} ({room.type})</span>
                                            <span className="text-sm font-normal text-subtext-light">Capacidad: {room.capacity}</span>
                                        </h2>

                                        <div className="space-y-6">
                                            {guests[room.id]?.map((guest, idx) => (
                                                <GuestForm
                                                    key={guest.id}
                                                    index={idx}
                                                    guest={guest}
                                                    onChange={(field, val) => handleGuestChange(room.id, idx, field, val)}
                                                    onSetResponsible={() => handleSetResponsible(room.id, idx)}
                                                    isResponsibleOfBooking={guest.isResponsible}
                                                    errors={formErrors[guest.id]}
                                                    onRemove={idx > 0 ? () => handleRemoveGuest(room.id, idx) : undefined}
                                                />
                                            ))}
                                            {guests[room.id].length < room.capacity && (
                                                <button
                                                    onClick={() => handleAddGuest(room.id)}
                                                    className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors"
                                                >
                                                    <span className="text-xl">+</span>
                                                    <span>Agregar Huésped</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4 mb-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-sm text-subtext-light hover:text-text-light underline"
                                >
                                    &larr; Volver a huéspedes
                                </button>
                            </div>

                            <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 shadow-md border border-border-light dark:border-border-dark">
                                <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">
                                    Servicios Adicionales
                                </h2>
                                <p className="text-sm text-subtext-light dark:text-subtext-dark mb-6">
                                    Selecciona los servicios que deseas agregar a tu estadía.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableServices.length > 0 ? (
                                        availableServices.map((service) => {
                                            const isSelected = selectedServices.some(s => s.id === service.id);
                                            return (
                                                <div
                                                    key={service.id}
                                                    onClick={() => toggleService(service)}
                                                    className={`
                                                        cursor-pointer p-4 rounded-lg border-2 transition-all flex justify-between items-center
                                                        ${isSelected
                                                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                            : 'border-border dark:border-border-dark hover:border-primary/50'
                                                        }
                                                    `}
                                                >
                                                    <div>
                                                        <h3 className="font-semibold text-text-light dark:text-text-dark">{service.service}</h3>
                                                        <p className="text-primary font-bold">${service.price.toLocaleString("es-CL")}</p>
                                                        {(service.start_time || service.end_time) && (
                                                            <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                                </svg>
                                                                {service.start_time?.slice(0, 5) || ''} - {service.end_time?.slice(0, 5) || ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={`
                                                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                        ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}
                                                    `}>
                                                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-muted-foreground p-4">No hay servicios disponibles.</p>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-border flex justify-end items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-sm text-muted-foreground block">Total Servicios</span>
                                        <span className="text-lg font-bold">${totalServices.toLocaleString("es-CL")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && date?.from && date?.to && (
                        <ReservationSummaryStep
                            guests={guests}
                            selectedRooms={selectedRooms}
                            dateRange={{ from: date.from, to: date.to }}
                            totalAmount={totalAmount}
                            nights={nights}
                            selectedServices={selectedServices}
                            onConfirm={validateAndSubmit}
                            onBack={() => setStep(3)}
                        />
                    )}
                </div>

                {step !== 4 && (
                    <div className="md:col-span-1">
                        <div className="sticky top-4">
                            <BookingSummary
                                selectedRooms={selectedRooms}
                                totalAmount={totalAmount}
                                nights={nights}
                                onContinue={handleContinue}
                                buttonText={step === 1 ? "Continuar" : step === 3 ? "Ver Resumen" : "Continuar"}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}