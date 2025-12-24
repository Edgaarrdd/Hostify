
import { Resend } from 'resend';
import { ReservationEmail } from '@/components/emails/reservation-template';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { render } from '@react-email/components';

// Inicializar Resend con la clave API del entorno
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendReservationEmailParams {
    to: string;
    reservationCode: string;
    guestName: string;
    checkIn: Date | string;
    checkOut: Date | string;
    nights: number;
    roomDetails: string[];
    totalAmount: number;
    paymentType: 'full' | 'partial';
    // Nuevos campos
    guestCount: number;
    subtotalRooms: number;
    subtotalServices: number;
    services: { name: string; price: number }[];
    discountAmount: number;
    totalNet: number;
    totalTax: number;
    amountPaid: number;
    amountPending: number;
    emailTitle?: string;
    emailIntro?: string;
    status?: string;
    paymentStatus?: string;
}

export async function sendReservationEmail(params: SendReservationEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY is missing. Email sending skipped.");
        return { success: false, error: "Configuration missing" };
    }

    try {
        const {
            to,
            reservationCode,
            guestName,
            checkIn,
            checkOut,
            nights,
            roomDetails,
            totalAmount,
            paymentType,
            guestCount,
            subtotalRooms,
            subtotalServices,
            services,
            discountAmount,
            totalNet,
            totalTax,
            amountPaid,
            amountPending,
            emailTitle,
            emailIntro,
            status,
            paymentStatus
        } = params;

        // Parseo seguro de fechas con valores de respaldo
        let fmtCheckIn = String(checkIn);
        let fmtCheckOut = String(checkOut);

        try {
            const dateCheckIn = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
            const dateCheckOut = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;

            // Verificar fecha inválida
            if (dateCheckIn instanceof Date && !isNaN(dateCheckIn.getTime())) {
                fmtCheckIn = format(dateCheckIn, "d 'de' MMMM, yyyy", { locale: es });
            }
            if (dateCheckOut instanceof Date && !isNaN(dateCheckOut.getTime())) {
                fmtCheckOut = format(dateCheckOut, "d 'de' MMMM, yyyy", { locale: es });
            }
        } catch (e) {
            console.error("⚠️ Error formatting dates:", e);
            // El respaldo a cadenas originales ya está establecido
        }

        console.log("Preparing to render email for:", { to, reservationCode, guestName });

        let emailHtml = "";
        try {
            // Renderizar el componente de correo a una cadena HTML
            emailHtml = await render(
                ReservationEmail({
                    reservationCode,
                    guestName,
                    checkIn: fmtCheckIn,
                    checkOut: fmtCheckOut,
                    nights,
                    roomDetails,
                    totalAmount,
                    paymentType,
                    guestCount,
                    subtotalRooms,
                    subtotalServices,
                    services,
                    discountAmount,
                    totalNet,
                    totalTax,
                    amountPaid,
                    amountPending,
                    emailTitle,
                    emailIntro,
                    status,
                    paymentStatus
                })
            );
            console.log(" Email HTML generated successfully. Length:", emailHtml.length);
        } catch (renderError) {
            console.error(" Critical Error rendering email template:", renderError);
            return { success: false, error: "Template rendering failed" };
        }

        // Lógica para manejar limitaciones del Modo de Prueba de Resend
        // En "Testing", SOLO puedes enviar a tu correo verificado (duermebien57@gmail.com).
        const ADMIN_EMAIL = 'duermebien57@gmail.com';
        let recipientEmails = [to];
        let subjectPrefix = "";

        // Verificación simple: Si no estamos enviando al admin, y sospechamos que estamos en modo prueba (o solo por seguridad en config dev actual)

        if (to !== ADMIN_EMAIL) {
            console.warn(`Resend Testing Mode: Redirecting email from ${to} to ${ADMIN_EMAIL}`);
            recipientEmails = [ADMIN_EMAIL];
            subjectPrefix = `[TEST -> ${to}] `;
        }

        const { data, error } = await resend.emails.send({
            from: 'Hostify <reservas@resend.dev>', // hay que actualizar esto cuando verifiquemos un dominio (e.g. reservas@hostify.cl)
            to: recipientEmails,
            html: emailHtml,
            subject: `${subjectPrefix}${emailTitle || 'Confirmación de Reserva'} #${reservationCode} - Hostify`,
        });

        if (error) {
            console.error("Resend API Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Unexpected error sending email:", error);
        return { success: false, error: "Unexpected error" };
    }
}
