export const COUNTRIES = [
    { code: "CL", name: "Chile", phone: "56" },
    { code: "AR", name: "Argentina", phone: "54" },
    { code: "PE", name: "Perú", phone: "51" },
    { code: "BO", name: "Bolivia", phone: "591" },
    { code: "BR", name: "Brasil", phone: "55" },
    { code: "CO", name: "Colombia", phone: "57" },
    { code: "UY", name: "Uruguay", phone: "598" },
    { code: "PY", name: "Paraguay", phone: "595" },
    { code: "EC", name: "Ecuador", phone: "593" },
    { code: "VE", name: "Venezuela", phone: "58" },
    { code: "US", name: "Estados Unidos", phone: "1" },
    { code: "ES", name: "España", phone: "34" },
    { code: "MX", name: "México", phone: "52" },
    // Agregar más según sea necesario
].sort((a, b) => a.name.localeCompare(b.name));
