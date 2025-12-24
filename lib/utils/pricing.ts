/**
 * UTILIDADES DE PRECIOS - CÁLCULO DE IVA
 * 
 *
 * - price_base: Lo que ve el cliente (ej. $26.000 CLP - múltiplo de 1.000)
 * - price_net: Precio real sin IVA (enviado a APIs de pago)
 * - iva_amount: Monto de impuesto (19% de price_net)
 * 
 * Fórmula: price_base = price_net * (1 + 0.19)
 * Inversa: price_net = price_base / 1.19
 */

const IVA_PERCENTAGE = 19;


/**
 * Calcular desglose de precio desde precio de visualización (lo que ve el cliente)
 * @param priceDisplay - Precio mostrado al cliente (ej. $26.000)
 * @param ivaPercentage - Porcentaje de IVA (por defecto: 19 para Chile)
 * @returns Objeto con price_display, price_net, e iva_amount
 */
export function getPriceBreakdown(
  priceDisplay: number,
  ivaPercentage: number = IVA_PERCENTAGE
) {
  const multiplier = 1 + ivaPercentage / 100;
  const price_net = Math.round(priceDisplay / multiplier);
  const iva_amount = priceDisplay - price_net;

  return {
    price_display: priceDisplay, // $26.000 (lo que ve el cliente)
    price_net: price_net, // $21.848 (para APIs de pago)
    iva_amount: iva_amount, // $4.152 (desglose de impuestos)
  };
}

/**
 * Calcular subtotal para múltiples noches
 * @param priceBase - Precio por noche (precio de visualización)
 * @param numberOfNights - Número de noches
 * @returns Subtotal antes de descuentos
 */
export function calculateSubtotal(
  priceBase: number,
  numberOfNights: number
): number {
  return priceBase * numberOfNights;
}

/**
 * Aplicar descuento al precio final
 * @param subtotal - Monto antes del descuento
 * @param discountPercentage - Porcentaje de descuento (0-100)
 * @returns Precio final después del descuento (redondeado a los 100 más cercanos)
 */
export function applyDiscount(
  subtotal: number,
  discountPercentage: number
): number {
  if (discountPercentage < 0 || discountPercentage > 100) {
    return subtotal;
  }
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);
  return subtotal - discountAmount;
}

/**
 * Obtener resumen completo de precios para reserva
 * Útil para mostrar en UI y enviar a APIs de pago
 */
export function getReservationPricingSummary(
  priceBasePerNight: number,
  numberOfNights: number,
  discountPercentage: number = 0,
  additionalServices: number = 0 // ej., total de servicios
) {
  const roomSubtotal = calculateSubtotal(priceBasePerNight, numberOfNights);
  const subtotalWithServices = roomSubtotal + additionalServices;
  const totalAfterDiscount = applyDiscount(
    subtotalWithServices,
    discountPercentage
  );
  const discountAmount = subtotalWithServices - totalAfterDiscount;

  return {
    // Valores de visualización (lo que ve el cliente)
    room_subtotal: roomSubtotal,
    services_total: additionalServices,
    subtotal_before_discount: subtotalWithServices,
    discount_amount: discountAmount,
    total_display: totalAfterDiscount, // Precio final que paga el cliente

    // Valores de API (para procesamiento de pagos)
    ...getPriceBreakdown(totalAfterDiscount),
  };
}
