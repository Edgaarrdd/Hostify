"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createOffer, updateOffer } from "@/lib/actions/offers";
import { OfferFormData } from "@/lib/types/forms";
import { Offer } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Schema de validación
const offerSchema = z.object({
    title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.coerce.number().min(1, "El valor debe ser mayor a 0"),
    start_date: z.string().min(1, "Fecha de inicio requerida"),
    end_date: z.string().min(1, "Fecha de fin requerida"),
    code: z.string().optional(),
    status: z.enum(["active", "inactive"]),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface OfferFormProps {
    offer?: Offer;
}

export function OfferForm({ offer }: OfferFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Valores iniciales
    const defaultValues = offer
        ? {
            title: offer.title,
            description: offer.description || "",
            discount_type: offer.discount_type,
            discount_value: offer.discount_value,
            start_date: offer.start_date,
            end_date: offer.end_date,
            code: offer.code || "",
            status: offer.status === "expired" ? "inactive" : offer.status,
        }
        : {
            title: "",
            description: "",
            discount_type: "percentage" as const,
            discount_value: 0,
            start_date: new Date().toISOString().split("T")[0],
            end_date: "",
            code: "",
            status: "active" as const,
        };

    const form = useForm<OfferFormValues>({
        resolver: zodResolver(offerSchema) as unknown as Resolver<OfferFormValues>,
        defaultValues,
    });

    async function onSubmit(values: z.infer<typeof offerSchema>) {
        setIsSubmitting(true);

        // Convertir a OfferFormData
        const formData: OfferFormData = {
            title: values.title,
            description: values.description || "",
            discount_type: values.discount_type,
            discount_value: values.discount_value,
            start_date: values.start_date,
            end_date: values.end_date,
            code: values.code || "",
            status: values.status,
        };

        let result;
        if (offer) {
            result = await updateOffer(offer.id, formData);
        } else {
            result = await createOffer(formData);
        }

        if (result.success) {
            toast.success(result.message);
            router.push("/protected/ofertas");
            router.refresh();
        } else {
            toast.error(result.error);
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Título */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título de la Oferta</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Verano 2025" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Código */}
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Código Promocional (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: VERANO25" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Código que el usuario debe ingresar (si aplica)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Tipo de Descuento */}
                    <FormField
                        control={form.control}
                        name="discount_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Descuento</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                        <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Valor de Descuento */}
                    <FormField
                        control={form.control}
                        name="discount_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor del Descuento</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Fecha Inicio */}
                    <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Inicio de Validez</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Fecha Fin */}
                    <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fin de Validez</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Estado */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Activa</SelectItem>
                                        <SelectItem value="inactive">Inactiva</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Descripción */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Detalles sobre las condiciones de la oferta..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {offer ? "Guardar Cambios" : "Crear Oferta"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
