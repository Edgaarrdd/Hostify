"use client";

import { useState } from "react";
import { Offer } from "@/lib/types/models";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Power, Tag } from "lucide-react";
import Link from "next/link";
import { deleteOffer, toggleOfferStatus } from "@/lib/actions/offers";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OffersTableProps {
    initialOffers: Offer[];
}

export function OffersTable({ initialOffers }: OffersTableProps) {
    const [offers, setOffers] = useState<Offer[]>(initialOffers);

    const handleDelete = async (id: string) => {
        const result = await deleteOffer(id);
        if (result.success) {
            toast.success(result.message);
            setOffers(offers.filter((o) => o.id !== id));
        } else {
            toast.error(result.error);
        }
    };

    const handleToggleStatus = async (offer: Offer) => {
        const result = await toggleOfferStatus(offer.id, offer.status);
        if (result.success) {
            toast.success(result.message);
            setOffers(
                offers.map((o) =>
                    o.id === offer.id
                        ? { ...o, status: o.status === "active" ? "inactive" : "active" }
                        : o
                )
            );
        } else {
            toast.error(result.error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(value);
    };

    return (
        <div className="rounded-md border border-border-light dark:border-border-dark bg-content-light dark:bg-content-dark">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Validez</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {offers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No hay ofertas registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        offers.map((offer) => (
                            <TableRow key={offer.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{offer.title}</span>
                                        {offer.description && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {offer.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {offer.code ? (
                                        <Badge variant="outline" className="font-mono">
                                            {offer.code}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                        <Tag className="h-3 w-3" />
                                        {offer.discount_type === "percentage"
                                            ? `${offer.discount_value}%`
                                            : formatCurrency(offer.discount_value)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{offer.start_date}</div>
                                        <div className="text-muted-foreground">hasta</div>
                                        <div>{offer.end_date}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            offer.status === "active"
                                                ? "default"
                                                : offer.status === "expired"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {offer.status === "active"
                                            ? "Activa"
                                            : offer.status === "expired"
                                                ? "Expirada"
                                                : "Inactiva"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleStatus(offer)}
                                            title={offer.status === "active" ? "Desactivar" : "Activar"}
                                        >
                                            <Power
                                                className={`h-4 w-4 ${offer.status === "active"
                                                        ? "text-emerald-500"
                                                        : "text-muted-foreground"
                                                    }`}
                                            />
                                        </Button>
                                        <Link href={`/protected/ofertas/${offer.id}/editar`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente la oferta
                                                        "{offer.title}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(offer.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
