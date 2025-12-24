import { fetchOfferById } from "@/lib/queries/offers";
import { OfferForm } from "@/components/ofertas/offer-form";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";

export default async function EditarOfertaPage({
    params,
}: {
    params: { id: string };
}) {
    const offer = await fetchOfferById(params.id);

    if (!offer) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Heading
                    title="Editar Oferta"
                    description="Modifica los detalles de la oferta."
                />
            </div>
            <Separator />
            <div className="max-w-2xl">
                <OfferForm offer={offer} />
            </div>
        </div>
    );
}
