import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Heading,
    Hr,
    Row,
    Column,
    Preview,
} from '@react-email/components';

interface ReservationEmailProps {
    reservationCode: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomDetails: string[];
    totalAmount: number;
    paymentType: 'full' | 'partial';
    // Nuevos campos para resumen detallado
    guestCount: number;
    subtotalRooms: number;
    subtotalServices: number;
    services: { name: string; price: number }[];
    discountAmount: number;
    totalNet: number;
    totalTax: number;
    amountPaid: number;
    amountPending: number;
    // Campos dinámicos para personalización (soporte Admin vs Guest)
    emailTitle?: string;
    emailIntro?: string;
    status?: string; // Nuevo campo para estado (Confirmada, Cancelada, etc.)
    paymentStatus?: string; // Nuevo campo para estado de pago detallado
}

export const ReservationEmail = ({
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
    emailTitle, // Opcional
    emailIntro, // Opcional
    status, // Opcional
    paymentStatus // Opcional
}: ReservationEmailProps) => {
    const previewText = `${emailTitle || 'Reserva Confirmada'} #${reservationCode} - Hostify`;
    const isCancelled = status === 'Cancelada';
    const headerColor = isCancelled ? '#dc2626' : '#13a4ec'; // Rojo si cancelada, Azul si no

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {/* Banner de Cabecera */}
                    <Section style={{ ...styles.header, backgroundColor: headerColor }}>
                        <Heading style={styles.brand}>Hostify</Heading>
                        <Text style={styles.subtitle}>Hotel & Refugio</Text>
                    </Section>

                    <div style={styles.content}>
                        <Section style={styles.greeting}>
                            <Heading style={{ ...styles.successTitle, color: isCancelled ? '#dc2626' : '#10b981' }}>{emailTitle || "¡Reserva Confirmada!"}</Heading>
                            <Text style={styles.text}>
                                {emailIntro ? (
                                    <span dangerouslySetInnerHTML={{ __html: emailIntro }} />
                                ) : (
                                    <>Hola <strong>{guestName}</strong>, tu estadía está asegurada.</>
                                )}
                            </Text>
                        </Section>

                        {/* Tarjeta de Información Principal */}
                        <Section style={styles.card}>
                            <Row style={styles.row}>
                                <Column>
                                    <Text style={styles.label}>Código</Text>
                                    <Text style={styles.code}>
                                        {reservationCode}
                                    </Text>
                                </Column>
                                <Column style={{ textAlign: 'right' }}>
                                    <Text style={styles.label}>Estado Pago</Text>
                                    <Text style={{
                                        ...styles.badge,
                                        backgroundColor: isCancelled ? '#fee2e2' : (paymentType === 'full' ? '#dcfce7' : '#fef9c3'),
                                        color: isCancelled ? '#991b1b' : (paymentType === 'full' ? '#15803d' : '#a16207')
                                    }}>
                                        {isCancelled
                                            ? (paymentStatus === 'retained' ? 'REEMBOLSO RETENIDO' : 'CANCELADA')
                                            : (paymentType === 'full' ? 'PAGADO' : 'ANTICIPO')}
                                    </Text>
                                </Column>
                            </Row>

                            <Hr style={styles.divider} />

                            <Row>
                                <Column>
                                    <Text style={styles.label}>Entrada</Text>
                                    <Text style={styles.value}>{checkIn}</Text>
                                    <Text style={styles.subtext}>15:00 hrs</Text>
                                </Column>
                                <Column>
                                    <Text style={styles.label}>Salida</Text>
                                    <Text style={styles.value}>{checkOut}</Text>
                                    <Text style={styles.subtext}>11:00 hrs</Text>
                                </Column>
                                <Column style={{ textAlign: 'right' }}>
                                    <Text style={styles.label}>Duración</Text>
                                    <Text style={styles.value}>{nights} Noches</Text>
                                    <Text style={styles.subtext}>{guestCount} Huésped(es)</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Habitaciones y Servicios */}
                        <Section style={{ marginBottom: '32px' }}>
                            <Text style={styles.sectionTitle}>Detalle Alojamiento</Text>
                            {roomDetails.map((room, index) => (
                                <Text key={index} style={styles.roomItem}>
                                    {room}
                                </Text>
                            ))}

                            {services.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <Text style={{ ...styles.sectionTitle, fontSize: '14px', marginBottom: '8px' }}>Servicios Adicionales:</Text>
                                    {services.map((service, idx) => (
                                        <Row key={idx} style={{ marginBottom: '4px' }}>
                                            <Column><Text style={styles.text}>• {service.name}</Text></Column>
                                            <Column style={{ textAlign: 'right' }}><Text style={styles.text}>${service.price.toLocaleString("es-CL")}</Text></Column>
                                        </Row>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Desglose Financiero */}
                        <Section style={styles.card}>
                            <Text style={styles.sectionTitle}>Resumen Financiero</Text>

                            <Row style={styles.row}>
                                <Column><Text style={styles.labelRow}>Subtotal Habitaciones</Text></Column>
                                <Column style={{ textAlign: 'right' }}><Text style={styles.valueRow}>${subtotalRooms.toLocaleString("es-CL")}</Text></Column>
                            </Row>
                            {subtotalServices > 0 && (
                                <Row style={styles.row}>
                                    <Column><Text style={styles.labelRow}>Subtotal Servicios</Text></Column>
                                    <Column style={{ textAlign: 'right' }}><Text style={styles.valueRow}>${subtotalServices.toLocaleString("es-CL")}</Text></Column>
                                </Row>
                            )}
                            {discountAmount > 0 && (
                                <Row style={styles.row}>
                                    <Column><Text style={{ ...styles.labelRow, color: '#16a34a' }}>Descuento</Text></Column>
                                    <Column style={{ textAlign: 'right' }}><Text style={{ ...styles.valueRow, color: '#16a34a' }}>-${discountAmount.toLocaleString("es-CL")}</Text></Column>
                                </Row>
                            )}

                            <Hr style={styles.divider} />

                            <Row style={styles.row}>
                                <Column><Text style={styles.labelRowSmall}>Neto</Text></Column>
                                <Column style={{ textAlign: 'right' }}><Text style={styles.labelRowSmall}>${totalNet.toLocaleString("es-CL")}</Text></Column>
                            </Row>
                            <Row style={{ marginBottom: '12px' }}>
                                <Column><Text style={styles.labelRowSmall}>IVA (19%)</Text></Column>
                                <Column style={{ textAlign: 'right' }}><Text style={styles.labelRowSmall}>${totalTax.toLocaleString("es-CL")}</Text></Column>
                            </Row>

                            <Hr style={styles.divider} />

                            <Row style={{ marginBottom: '8px' }}>
                                <Column><Text style={styles.totalLabel}>Total General</Text></Column>
                                <Column style={{ textAlign: 'right' }}><Text style={styles.totalValue}>${totalAmount.toLocaleString("es-CL")}</Text></Column>
                            </Row>

                            <div style={styles.paymentBox}>
                                <Row>
                                    <Column>
                                        <Text style={styles.paidLabel}>Pagado Ahora</Text>
                                    </Column>
                                    <Column style={{ textAlign: 'right' }}>
                                        <Text style={styles.paidValue}>${amountPaid.toLocaleString("es-CL")}</Text>
                                    </Column>
                                </Row>
                                {amountPending > 0 && (
                                    <Row style={{ marginTop: '4px' }}>
                                        <Column>
                                            <Text style={styles.pendingLabel}>Pendiente (al llegar)</Text>
                                        </Column>
                                        <Column style={{ textAlign: 'right' }}>
                                            <Text style={styles.pendingValue}>${amountPending.toLocaleString("es-CL")}</Text>
                                        </Column>
                                    </Row>
                                )}
                            </div>
                        </Section>

                        {/* Acciones de Pie de Página */}
                        <Section style={{ textAlign: 'center', marginTop: '32px' }}>
                            <Text style={styles.footerText}>
                                Si tienes alguna pregunta, llámanos al +56 9 8888 8888.
                            </Text>
                        </Section>
                    </div>

                    {/* Legal Pie de Página */}
                    <Section style={styles.footer}>
                        <Text style={styles.footerText}>
                            © {new Date().getFullYear()} Hostify Hotel & Refugio.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

import { styles } from './styles';

