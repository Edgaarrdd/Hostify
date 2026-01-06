"use server";

import OpenAI from "openai";
import twilio from "twilio";
import logger from "@/lib/utils/logger";

// Configuración de clientes
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * FUNCIÓN 1: WHATSAPP (Soporta Idiomas y Mensajes Inteligentes)
 * Se encarga de redactar y enviar mensajes vía Twilio.
 */
export async function sendWhatsAppMessage(
  type: "reminder" | "checkin" | "checkout",
  guestName: string,
  guestPhone: string,
  roomNumber: string | number,
  country: string = "Chile",
  hotelAddress: string = "Av. Principal 123",
  wifiPass: string = "SolYPlaya2025"
) {
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  // Aseguramos formato whatsapp:+569...
  const toNumber = guestPhone.startsWith('whatsapp:') ? guestPhone : `whatsapp:${guestPhone}`;
  let messageBody = "";

  logger.info(`Intentando enviar mensaje WhatsApp`, { type, country, toNumber });

  try {
    // ---------------------------------------------------------
    // INTENTO DE REDACCIÓN CON IA (OpenAI)
    // ---------------------------------------------------------
    const systemPrompt = `
      Eres el concierge del Hotel Duerme Bien (Ubicación: ${hotelAddress}). 
      Huésped: ${guestName} (País: ${country}).
      
      IDIOMA OBLIGATORIO SEGÚN PAÍS:
      - Brasil -> PORTUGUÉS 🇧🇷.
      - US, USA, UK, United Kingdom -> INGLÉS 🇺🇸.
      - Alemania -> ALEMÁN 🇩🇪.
      - Otros -> ESPAÑOL 🇨🇱.

      Tarea:
      - "reminder": Recordar reserva Hab ${roomNumber}. Pedir confirmación de llegada.
      - "checkin": Bienvenida calurosa Hab ${roomNumber}. Clave WIFI: "${wifiPass}".
      - "checkout": Despedida cordial. Pedir calificación de estadía.
      
      Tono: Muy amable, profesional y breve (máximo 300 caracteres). Usa emojis.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemPrompt }]
    });
    messageBody = completion.choices[0].message.content || "";

  } catch (error: unknown) {
    // ---------------------------------------------------------
    // RESPALDO MANUAL MEJORADO (PLAN B - "Modo Truco")
    // Se activa si falla la IA o no hay saldo. Parece IA real.
    // ---------------------------------------------------------
    logger.warn("Error en OpenAI, usando respaldo manual", error);

    const c = country.toLowerCase().trim();
    const isBrazil = c.includes("bra") || c.includes("br");
    const isEnglish = c === "us" || c.includes("usa") || c.includes("united") || c.includes("uk") || c.includes("ingl");

    const wifiName = "Hotel_Hostify_5G";
    const actualWifiPass = "SolYPlaya2025";

    if (isBrazil) {
      // Portugués con emojis
      if (type === "reminder") messageBody = `Olá ${guestName}! 👋 Aqui é a equipe do Hotel Duerme Bien. Estamos ansiosos pela sua chegada! 🏨 Quarto ${roomNumber} reservado. Tudo certo para vir?`;
      else if (type === "checkin") messageBody = `Bem-vindo(a) ${guestName}! 🌟 Seu quarto ${roomNumber} está impecável esperando por você. \n📶 WiFi: ${wifiName}\n🔑 Senha: ${actualWifiPass}\nTenha uma estadia incrível!`;
      else messageBody = `Foi um prazer receber você, ${guestName}! 😊 Esperamos que tenha descansado bem. Boa viagem e até a próxima! 👋`;
    } else if (isEnglish) {
      // Inglés con emojis
      if (type === "reminder") messageBody = `Hi ${guestName}! 👋 This is Hotel Duerme Bien team. Quick reminder: your Room ${roomNumber} is waiting for you! 🏨 Can you confirm your arrival? Safe travels!`;
      else if (type === "checkin") messageBody = `Welcome ${guestName}! ✨ We are happy to have you.\nYour room ${roomNumber} is ready. 🛏️\n📶 WiFi: ${wifiName}\n🔑 Password: ${actualWifiPass}\nEnjoy your stay!`;
      else messageBody = `Thank you for staying with us, ${guestName}. 😊 We hope you had a great time. See you soon! 👋`;
    } else {
      // ESPAÑOL MEJORADO (Parece IA)
      if (type === "reminder") messageBody = `¡Hola ${guestName}! 👋 Le saludamos del Hotel Duerme Bien. Solo queríamos recordarle que su habitación ${roomNumber} le está esperando. 🏨 ¿Nos confirma su llegada? ¡Saludos!`;
      else if (type === "checkin") messageBody = `¡Bienvenido/a ${guestName}! ✨ Es un gusto tenerle aquí.\n\nSu habitación ${roomNumber} está lista y sanitizada. 🛏️\n📶 WiFi: ${wifiName}\n🔑 Clave: ${actualWifiPass}\n\n¡Que disfrute su estadía! Si necesita algo, escríbanos.`;
      else messageBody = `¡Gracias por su visita, ${guestName}! 😊 Esperamos que haya tenido una experiencia excelente. ¡Buen viaje de regreso y hasta pronto! 👋`;
    }
  }

  // ---------------------------------------------------------
  // ENVÍO FINAL A TRAVÉS DE TWILIO
  // ---------------------------------------------------------
  try {
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toNumber
    });
    logger.info("Mensaje WhatsApp enviado con éxito", { sid: message.sid, to: toNumber });
    return { success: true, sid: message.sid };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Error al enviar mensaje por Twilio", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * FUNCIÓN 2: ANALIZADOR DE PETICIONES (Detector de Incidentes)
 */
export async function analyzeGuestRequest(requestText: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Analiza: "${requestText}". Responde solo JSON:
        { "departamento": "Seguridad"|"Mantenimiento"|"Limpieza"|"Recepción", 
          "urgencia": "Baja"|"Media"|"Alta"|"Crítica", 
          "sentimiento": string, 
          "resumen": string }
        REGLA: Peligro físico o robo es "Crítica" y "Seguridad".`
      }],
      response_format: { type: "json_object" }
    });
    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return { success: true, data };

  } catch (error: unknown) {
    logger.warn("Fallo OpenAI para análisis de incidentes, usando detector manual", error);

    const text = requestText.toLowerCase();

    // 1. SEGURIDAD / CRÍTICA 
    if (text.includes("gas") || text.includes("fuego") || text.includes("incendio") || text.includes("robo") || text.includes("asalt") || text.includes("emergencia")) {
      return {
        success: true,
        data: { departamento: "Seguridad", urgencia: "Crítica", sentimiento: "Alerta", resumen: "EMERGENCIA REPORTADA" }
      };
    }

    // 2. MANTENIMIENTO / ALTA 
    if (text.includes("agua") || text.includes("gotera") || text.includes("luz") || text.includes("electri") || text.includes("baño") || text.includes("cañeria")) {
      return {
        success: true,
        data: { departamento: "Mantenimiento", urgencia: "Alta", sentimiento: "Molesto", resumen: "Falla de infraestructura" }
      };
    }

    // 3. LIMPIEZA / MEDIA 
    if (text.includes("toalla") || text.includes("sucio") || text.includes("limp") || text.includes("papel") || text.includes("aseo")) {
      return {
        success: true,
        data: { departamento: "Limpieza", urgencia: "Media", sentimiento: "Neutral", resumen: "Solicitud de aseo/suministros" }
      };
    }

    // DEFAULT
    return {
      success: true,
      data: { departamento: "Recepción", urgencia: "Baja", sentimiento: "Neutral", resumen: "Consulta general" }
    };
  }
}

// --- LEGACY EXPORTS (Para compatibilidad) ---
export async function sendSmartWelcome(name: string, room: string, phone: string, country: string) {
  return sendWhatsAppMessage("checkin", name, phone, room, country);
}

export async function sendPreArrivalReminder(name: string, phone: string, room: string) {
  return sendWhatsAppMessage("reminder", name, phone, room);
}