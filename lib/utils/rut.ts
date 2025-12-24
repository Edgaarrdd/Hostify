export function cleanRut(rut: string) {
    return rut.replace(/[^0-9kK]/g, "");
}

export function formatRut(rut: string) {
    const clean = cleanRut(rut);
    if (!clean) return "";

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    if (clean.length < 2) return clean;

    // Formatear con puntos
    let formattedBody = "";
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        formattedBody = body.charAt(i) + formattedBody;
        if (j % 3 === 2 && i !== 0) {
            formattedBody = "." + formattedBody;
        }
    }

    return `${formattedBody}-${dv}`;
}

export function validateRut(rut: string): boolean {
    const clean = cleanRut(rut);
    if (clean.length < 2) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    // Verificar si el cuerpo es número
    if (!/^\d+$/.test(body)) return false;

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body.charAt(i)) * multiplier;
        multiplier = (multiplier + 1) % 8 || 2;
    }

    const calculatedDvIndex = 11 - (sum % 11);
    let calculatedDv = "";

    if (calculatedDvIndex === 11) calculatedDv = "0";
    else if (calculatedDvIndex === 10) calculatedDv = "K";
    else calculatedDv = calculatedDvIndex.toString();

    return dv === calculatedDv;
}
