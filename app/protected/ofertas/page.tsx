import { Suspense } from "react";
import { fetchOffers } from "@/lib/queries/offers";
import { OffersTable } from "@/components/ofertas/offers-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

export default async function OfertasPage() {
    const offers = await fetchOffers();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Heading
                    title={`Ofertas y Promociones (${offers.length})`}
                    description="Gestiona las ofertas y códigos promocionales para los huéspedes."
                />
                <Link href="/protected/ofertas/nueva">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Oferta
                    </Button>
                </Link>
            </div>
            <Separator />
            <Suspense fallback={<div>Cargando ofertas...</div>}>
                <OffersTable initialOffers={offers} />
            </Suspense>
        </div>
    );
}
