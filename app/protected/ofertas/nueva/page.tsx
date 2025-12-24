import { OfferForm } from "@/components/ofertas/offer-form";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

export default function NuevaOfertaPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Heading
                    title="Crear Nueva Oferta"
                    description="Configura una nueva promoción para los huéspedes."
                />
            </div>
            <Separator />
            <div className="max-w-2xl">
                <OfferForm />
            </div>
        </div>
    );
}
