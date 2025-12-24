# 🏨 Hostify - Sistema de Gestión Hotelera

Sistema integral de gestión hotelera desarrollado con Next.js 16, React 19 y Supabase. Diseñado para optimizar la administración de reservas, habitaciones, clientes y operaciones diarias de hoteles.

## ✨ Características Principales

### 📊 Dashboard Interactivo
- Vista en tiempo real del estado de habitaciones
- Estadísticas de ocupación y rendimiento
- Gráficos y métricas clave del negocio
- Navegación rápida a reservas activas

### 🛏️ Gestión de Habitaciones
- Administración completa de habitaciones
- Estados: disponible, ocupada, mantenimiento, limpieza
- Asignación de tipos y categorías
- Control de tarifas por habitación

### 📅 Sistema de Reservas
- Creación y gestión de reservas
- Asignación de huéspedes y servicios
- Gestión de pagos y estados
- Cancelación con notificaciones automáticas
- Historial completo de reservas

### 👥 Gestión de Clientes
- Base de datos de clientes
- Historial de reservas por cliente
- Información de contacto y preferencias
- Búsqueda y filtrado avanzado

### 💰 Planes Tarifarios y Ofertas
- Gestión de planes tarifarios
- Creación de ofertas especiales
- Precios dinámicos por temporada
- Descuentos y promociones

### 🤖 Conserje Virtual con IA
- Asistente inteligente con Google Gemini AI
- Análisis automático de solicitudes
- Gestión de tickets internos
- Notificaciones por email

### 👨‍💼 Gestión de Personal
- Administración de encargados
- Control de roles y permisos
- Sistema de autenticación seguro

### 📧 Sistema de Notificaciones
- Emails automáticos de confirmación
- Notificaciones de cancelación
- Integración con Resend
- Templates personalizados

### 📈 Reportes y Análisis
- Reportes de ocupación
- Análisis de ingresos
- Estadísticas de rendimiento
- Exportación de datos

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Estilos:** Tailwind CSS
- **Componentes:** shadcn/ui + Radix UI
- **Formularios:** React Hook Form + Zod
- **Gráficos:** Chart.js
- **Temas:** next-themes (modo oscuro/claro)
- **Iconos:** Lucide React

### Backend
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **ORM:** Supabase Client
- **Server Actions:** Next.js Server Actions
- **API Routes:** Next.js Route Handlers

### Integraciones
- **IA:** Google Generative AI (Gemini)
- **Email:** Resend + React Email
- **SMS/WhatsApp:** Twilio
- **Validación:** Zod

### DevOps
- **TypeScript:** Tipado estático completo
- **Linting:** ESLint
- **Package Manager:** npm
- **Deployment:** Vercel (recomendado)

## 📁 Estructura del Proyecto

```
proyecto_integrado_hotel/
├── app/                          # App Router de Next.js
│   ├── auth/                     # Páginas de autenticación
│   ├── protected/                # Rutas protegidas
│   │   ├── clientes/            # Gestión de clientes
│   │   ├── encargados/          # Gestión de personal
│   │   ├── habitaciones/        # Gestión de habitaciones
│   │   ├── ofertas/             # Ofertas especiales
│   │   ├── operaciones/         # Operaciones diarias
│   │   ├── plan-tarifario/      # Planes de precios
│   │   ├── reportes/            # Reportes y análisis
│   │   ├── reservas/            # Sistema de reservas
│   │   └── page.tsx             # Dashboard principal
│   └── layout.tsx               # Layout principal
├── components/                   # Componentes reutilizables
│   ├── ui/                      # Componentes de UI (shadcn)
│   └── ...                      # Componentes de negocio
├── lib/                         # Lógica de negocio
│   ├── actions/                 # Server Actions
│   ├── config/                  # Configuraciones
│   ├── queries/                 # Queries de base de datos
│   ├── repositories/            # Capa de acceso a datos
│   ├── services/                # Lógica de negocio
│   ├── supabase/                # Cliente de Supabase
│   ├── types/                   # Definiciones de tipos
│   └── utils/                   # Utilidades
├── public/                      # Archivos estáticos
├── migrations/                  # Migraciones de BD
└── ...                          # Archivos de configuración
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Resend (para emails)
- API Key de Google Gemini (opcional, para IA)

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd proyecto_integrado_hotel
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Resend (Email)
RESEND_API_KEY=tu_resend_api_key

# Google Gemini AI (opcional)
GEMINI_API_KEY=tu_gemini_api_key

# Twilio (opcional)
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_WHATSAPP_NUMBER=tu_numero_whatsapp
```

### 4. Configurar Base de Datos

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones de la carpeta `migrations/`
3. Configura las políticas de seguridad (RLS)
4. Copia las credenciales al archivo `.env.local`

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 6. Compilar para Producción

```bash
npm run build
npm start
```

## 🗄️ Esquema de Base de Datos

El sistema utiliza las siguientes tablas principales:

- **`habitaciones`** - Información de habitaciones
- **`reservas`** - Reservas del hotel
- **`reservation_guests_intermedia`** - Relación reservas-huéspedes
- **`guests`** - Información de huéspedes
- **`servicios`** - Servicios adicionales
- **`reservation_services_intermedia`** - Servicios por reserva
- **`plan_tarifario`** - Planes de precios
- **`ofertas`** - Ofertas especiales
- **`users`** - Usuarios del sistema
- **`profiles`** - Perfiles de usuario

## 🔐 Autenticación y Roles

El sistema implementa tres niveles de acceso:

1. **Administrador** - Acceso completo al sistema
2. **Encargado** - Gestión de operaciones diarias
3. **Cliente** - Vista limitada de sus reservas

La autenticación se maneja mediante Supabase Auth con políticas RLS (Row Level Security).

## 📧 Sistema de Emails

El sistema envía automáticamente:

- ✅ Confirmaciones de reserva
- ❌ Notificaciones de cancelación
- 📋 Resúmenes de reserva
- 🔔 Alertas administrativas

Los templates están construidos con React Email para un diseño profesional y responsive.

## 🤖 Conserje Virtual

El conserje virtual utiliza Google Gemini AI para:

- Analizar solicitudes de clientes
- Categorizar tickets automáticamente
- Generar respuestas inteligentes
- Priorizar tareas

## 📱 Características Adicionales

- **Responsive Design** - Optimizado para móvil, tablet y desktop
- **Modo Oscuro** - Tema claro/oscuro automático
- **Búsqueda Avanzada** - Filtros y búsqueda en tiempo real
- **Validación de Formularios** - Validación robusta con Zod
- **Notificaciones Toast** - Feedback visual con Sonner
- **Debouncing** - Optimización de búsquedas
- **Gestión de Estados** - Server Actions para mutaciones

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Compilar
npm run build

# Producción
npm start

# Linting
npm run lint
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Otras Plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propietario.

## 👨‍💻 Autor

Desarrollado para el sistema de gestión hotelera Hostify.

## 📞 Soporte

Para soporte y consultas, contacta al equipo de desarrollo.

---

**Nota:** Este README está en constante actualización. Para más información sobre características específicas, consulta la documentación interna del proyecto.
