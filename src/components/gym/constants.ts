import type { TourStep } from "./types";
import { LayoutDashboard, Users, CreditCard, Calendar, Fingerprint, Megaphone, UsersRound, Settings } from "lucide-react";

// Colors for charts
export const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// Navigation items
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "membresias", label: "Membresías", icon: CreditCard },
  { id: "reservas", label: "Reservas", icon: Calendar },
  { id: "accesos", label: "Accesos", icon: Fingerprint },
  { id: "promociones", label: "Promociones", icon: Megaphone },
];

export const ADMIN_NAV_ITEM = { id: "usuarios", label: "Usuarios", icon: UsersRound };

export const CONFIG_NAV_ITEM = { id: "configuracion", label: "Configuración", icon: Settings };

// Welcome tour steps
export const WELCOME_TOUR_STEPS: TourStep[] = [
  {
    target: "dashboard-section",
    title: "¡Bienvenido al Sistema de Gestión de Gimnasio!",
    content: "Este sistema te permite gestionar clientes, membresías, reservas, accesos biométricos y promociones. Te guiaremos por las principales funcionalidades.",
    position: "bottom",
  },
  {
    target: "nav-dashboard",
    title: "Dashboard Principal",
    content: "Aquí puedes ver un resumen general del gimnasio: clientes activos, membresías, accesos del día, ingresos y métricas de empleados.",
    position: "right",
  },
  {
    target: "nav-clientes",
    title: "Gestión de Clientes",
    content: "Registra nuevos clientes con sus datos personales, DNI y contacto. El sistema asignará automáticamente el empleado que lo registra.",
    position: "right",
  },
  {
    target: "nav-membresias",
    title: "Membresías",
    content: "Crea y administra planes de membresía. Asigna membresías a clientes usando el buscador biométrico o seleccionando manualmente.",
    position: "right",
  },
  {
    target: "nav-reservas",
    title: "Reservas de Clases",
    content: "Crea clases y gestiona las reservas de los clientes. Cada clase tiene horario, capacidad e instructor asignado.",
    position: "right",
  },
  {
    target: "nav-accesos",
    title: "Control de Accesos",
    content: "Verifica el acceso de clientes mediante código o huella biométrica. El sistema muestra información básica y estado de membresía.",
    position: "right",
  },
  {
    target: "nav-promociones",
    title: "Promociones WhatsApp",
    content: "Crea y envía promociones automáticas por WhatsApp a clientes con membresías próximas a vencer o expiradas.",
    position: "right",
  },
];

// Section-specific guides
export const SECTION_GUIDES: Record<string, TourStep[]> = {
  dashboard: [
    {
      target: "stats-cards",
      title: "Tarjetas de Estadísticas",
      content: "Aquí ves las métricas principales: total de clientes, membresías activas, accesos del día y clientes que requieren atención.",
      position: "bottom",
    },
    {
      target: "access-chart",
      title: "Gráfico de Accesos",
      content: "Visualiza los accesos de los últimos 7 días. Como administrador, ves todos; como empleado, solo tus accesos validados.",
      position: "top",
    },
    {
      target: "employee-metrics",
      title: "Métricas por Empleado",
      content: "Tabla con el rendimiento de cada empleado: clientes registrados, accesos validados y promociones enviadas.",
      position: "top",
    },
    {
      target: "alerts-section",
      title: "Alertas Importantes",
      content: "Membresías por vencer y expiradas que requieren atención. Usa el botón para enviar promociones.",
      position: "top",
    },
  ],
  clientes: [
    {
      target: "search-clientes",
      title: "Búsqueda de Clientes",
      content: "Busca clientes por nombre, apellido, email o DNI. Los resultados se filtran en tiempo real.",
      position: "bottom",
    },
    {
      target: "new-cliente-btn",
      title: "Registrar Cliente",
      content: "Haz clic aquí para registrar un nuevo cliente. El sistema lo asignará automáticamente a tu cuenta de empleado.",
      position: "left",
    },
    {
      target: "cliente-cards",
      title: "Tarjetas de Clientes",
      content: "Cada tarjeta muestra información del cliente y su estado de membresía. Haz clic para ver detalles.",
      position: "top",
    },
  ],
  membresias: [
    {
      target: "planes-section",
      title: "Planes de Membresía",
      content: "Aquí ves todos los planes disponibles con precios en Soles (S/). Puedes crear, editar o eliminar planes.",
      position: "bottom",
    },
    {
      target: "biometric-search",
      title: "Búsqueda Biométrica",
      content: "Ingresa el código de huella para encontrar rápidamente un cliente y asignarle una membresía.",
      position: "bottom",
    },
    {
      target: "assign-membresia",
      title: "Asignar Membresía",
      content: "Selecciona cliente, plan y método de pago. El sistema calculará automáticamente la fecha de vencimiento.",
      position: "top",
    },
  ],
  reservas: [
    {
      target: "clases-section",
      title: "Clases Disponibles",
      content: "Vista de todas las clases con horario, capacidad y reservas actuales. Crea nuevas clases con el botón.",
      position: "bottom",
    },
    {
      target: "reservar-btn",
      title: "Reservar Clase",
      content: "Selecciona un cliente y fecha para crear una reserva. El sistema verifica la disponibilidad.",
      position: "left",
    },
  ],
  accesos: [
    {
      target: "acceso-input",
      title: "Código de Acceso",
      content: "Ingresa el código único del cliente para verificar su acceso y estado de membresía.",
      position: "bottom",
    },
    {
      target: "verify-btn",
      title: "Verificar Acceso",
      content: "El sistema validará la membresía y mostrará un popup con información básica del cliente (sin datos sensibles).",
      position: "left",
    },
    {
      target: "acceso-result",
      title: "Resultado del Acceso",
      content: "Se muestra si el acceso es permitido o denegado, con días restantes de membresía y opción de renovación.",
      position: "top",
    },
    {
      target: "accesos-list",
      title: "Historial de Accesos",
      content: "Lista de los últimos accesos registrados con estado y hora.",
      position: "top",
    },
  ],
  promociones: [
    {
      target: "promociones-list",
      title: "Promociones Activas",
      content: "Lista de promociones creadas con descuento y validez. Puedes crear nuevas promociones.",
      position: "bottom",
    },
    {
      target: "send-promo-btn",
      title: "Enviar Promociones",
      content: "Envía promociones por WhatsApp a clientes con membresías por vencer o expiradas.",
      position: "left",
    },
  ],
  usuarios: [
    {
      target: "users-table",
      title: "Tabla de Usuarios",
      content: "Lista de todos los usuarios del sistema con su rol y estado. Solo visible para Super Usuario y Administrador.",
      position: "top",
    },
    {
      target: "new-user-btn",
      title: "Crear Usuario",
      content: "Crea nuevos usuarios y opcionalmente un empleado asociado al mismo tiempo.",
      position: "left",
    },
    {
      target: "user-actions",
      title: "Acciones de Usuario",
      content: "Edita usuarios, cambia contraseñas y gestiona permisos. El Super Usuario no puede ser eliminado.",
      position: "left",
    },
  ],
};
