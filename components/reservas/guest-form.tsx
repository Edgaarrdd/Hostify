import { Input } from "@/components/ui/input";
import { getGuestByRut } from "@/lib/actions/guests";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatRut, validateRut } from "@/lib/utils/rut";
import { COUNTRIES } from "@/lib/config/constants";
import { useState, useEffect } from "react";

/**
 * Estructura de datos para un huésped en el formulario.
 */
export interface Guest {
    id: string;
    documentType: "RUT" | "Pasaporte";
    documentNumber: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    country: string;
    city: string;
    email: string;
    phone: string;
    isResponsible: boolean;
}

interface GuestFormProps {
    index: number;
    guest: Guest;
    onChange: (field: keyof Guest, value: Guest[keyof Guest]) => void;
    onSetResponsible: () => void;
    isResponsibleOfBooking: boolean;
    errors?: Record<string, string>;
    onRemove?: () => void;
}

/**
 * Componente de formulario para ingresar o editar datos de un huésped individual.
 * Incluye validación de RUT chileno en tiempo real y autocompletado si el huésped ya existe.
 */
export function GuestForm({ index, guest, onChange, onSetResponsible, isResponsibleOfBooking, errors = {}, onRemove }: GuestFormProps) {
    const [phoneCode, setPhoneCode] = useState("56");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [rutError, setRutError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Inicializar el estado local del teléfono si el huésped ya trae uno
        if (guest.phone && !phoneNumber) {
            if (guest.phone.startsWith('+56')) {
                setPhoneNumber(guest.phone.substring(3));
                setPhoneCode("56");
            } else {
                // Lógica simple para otros casos, se podría mejorar parsing
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Actualizar al padre cada vez que cambie el código o el número local
        onChange("phone", `+${phoneCode}${phoneNumber}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phoneCode, phoneNumber]);

    /**
     * Se ejecuta cuando el campo de RUT pierde el foco.
     * Si el RUT es válido, busca en la base de datos si el huésped ya existe para autocompletar sus datos.
     */
    const handleRutBlur = async () => {
        if (guest.documentType === "RUT" && guest.documentNumber && !rutError) {
            setIsLoading(true);
            try {
                const data = await getGuestByRut(guest.documentNumber);
                if (data) {
                    onChange("firstName", data.firstName);
                    onChange("lastName", data.lastName);
                    onChange("email", data.email);

                    // --- NUEVA LÓGICA PARA EL TELÉFONO ---
                    if (data.phone) {
                        // 1. Limpiamos el '+' si viene en el string (ej: "+56912345678" -> "56912345678")
                        const rawPhone = data.phone.startsWith('+') ? data.phone.substring(1) : data.phone;

                        // 2. Buscamos si el número empieza con algún código de país de tu lista
                        const countryMatch = COUNTRIES.find(c => rawPhone.startsWith(c.phone));

                        if (countryMatch) {
                            // Si encontramos coincidencia (ej: empieza con 56), separamos
                            setPhoneCode(countryMatch.phone);
                            setPhoneNumber(rawPhone.replace(countryMatch.phone, '')); // Lo que sobra es el número
                        } else {
                            // Si no encontramos código, metemos todo al input
                            setPhoneNumber(rawPhone);
                        }

                        // 3. Actualizamos el dato en el formulario padre inmediatamente
                        onChange("phone", data.phone);
                    }
                    // --------------------------------------

                    if (data.birthDate) onChange("birthDate", data.birthDate);
                    if (data.country) {
                        onChange("country", data.country);
                        // Sincronizar código de teléfono con el país si no había teléfono guardado
                        if (!data.phone) {
                            const c = COUNTRIES.find(c => c.code === data.country);
                            if (c) setPhoneCode(c.phone);
                        }
                    }
                    if (data.city) onChange("city", data.city);
                }
            } catch (error) {
                console.error("Autofill error:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    /**
     * Maneja el cambio en el input de RUT.
     * Aplica formato automático (puntos y guión) y valida el dígito verificador.
     */
    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const fmt = formatRut(val);
        onChange("documentNumber", fmt);

        if (guest.documentType === "RUT") {
            const isValid = validateRut(val);
            setRutError(isValid ? "" : "RUT inválido");
        } else {
            setRutError("");
        }
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        onChange("country", code);

        const countryData = COUNTRIES.find(c => c.code === code);
        if (countryData) {
            setPhoneCode(countryData.phone);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange("email", val);
    };

    return (
        <div className="space-y-4 p-4 border rounded-md bg-card/50 relative group">
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar huésped"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
            <div className="flex justify-between items-center pr-8">
                <h4 className="font-medium text-sm text-subtext-light dark:text-subtext-dark">
                    Huésped {index + 1}
                </h4>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`responsible-${guest.id}`}
                        checked={isResponsibleOfBooking}
                        onCheckedChange={(checked) => {
                            if (checked) onSetResponsible();
                        }}
                    />
                    <Label htmlFor={`responsible-${guest.id}`} className="text-sm cursor-pointer">
                        Pasajero responsable
                    </Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`doc-type-${guest.id}`}>Tipo de documento <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <select
                            id={`doc-type-${guest.id}`}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={guest.documentType}
                            onChange={(e) => {
                                onChange("documentType", e.target.value as Guest['documentType']);
                                setRutError("");
                            }}
                        >
                            <option value="RUT">RUT</option>
                            <option value="Pasaporte">Pasaporte</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`doc-num-${guest.id}`}>Número de documento <span className="text-red-500">*</span></Label>
                    <Input
                        id={`doc-num-${guest.id}`}
                        value={guest.documentNumber}
                        onChange={guest.documentType === "RUT" ? handleRutChange : (e) => onChange("documentNumber", e.target.value)}
                        placeholder={guest.documentType === "RUT" ? "12.345.678-9" : "Número de pasaporte"}
                        className={rutError || errors.documentNumber ? "border-red-500" : ""}
                        onBlur={handleRutBlur}
                    />
                    {isLoading && <p className="text-xs text-muted-foreground mt-1">Buscando datos...</p>}
                    {(rutError || errors.documentNumber) && <p className="text-xs text-red-500">{rutError || errors.documentNumber}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`firstname-${guest.id}`}>Nombre <span className="text-red-500">*</span></Label>
                    <Input
                        id={`firstname-${guest.id}`}
                        value={guest.firstName}
                        onChange={(e) => onChange("firstName", e.target.value)}
                        className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`lastname-${guest.id}`}>Apellido <span className="text-red-500">*</span></Label>
                    <Input
                        id={`lastname-${guest.id}`}
                        value={guest.lastName}
                        onChange={(e) => onChange("lastName", e.target.value)}
                        className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`birthdate-${guest.id}`}>Fecha de nacimiento</Label>
                    <Input
                        id={`birthdate-${guest.id}`}
                        type="date"
                        value={guest.birthDate}
                        onChange={(e) => onChange("birthDate", e.target.value)}
                        className={errors.birthDate ? "border-red-500" : ""}
                    />
                    {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`country-${guest.id}`}>País <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <select
                            id={`country-${guest.id}`}
                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.country ? "border-red-500" : "border-input"}`}
                            value={guest.country}
                            onChange={handleCountryChange}
                        >
                            <option value="">Seleccione país</option>
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`city-${guest.id}`}>Ciudad</Label>
                    <Input
                        id={`city-${guest.id}`}
                        value={guest.city}
                        onChange={(e) => onChange("city", e.target.value)}
                        className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`email-${guest.id}`}>Correo Electrónico {isResponsibleOfBooking && <span className="text-red-500">*</span>}</Label>
                    <Input
                        id={`email-${guest.id}`}
                        type="email"
                        value={guest.email}
                        onChange={handleEmailChange}
                        className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`phone-${guest.id}`}>Teléfono {isResponsibleOfBooking && <span className="text-red-500">*</span>}</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={phoneCode}
                                onChange={(e) => setPhoneCode(e.target.value)}
                            >
                                {COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.phone}>
                                        {c.code} +{c.phone}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Input
                            id={`phone-${guest.id}`}
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="9 1234 5678"
                            className={`flex-1 ${errors.phone ? "border-red-500" : ""}`}
                        />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
            </div>
        </div>
    );
}