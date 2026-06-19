// Types for the Gym Management System

export interface Empleado {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  cargo: string;
  foto: string | null;
  activo: boolean;
  _count?: {
    clientesRegistrados: number;
    accesosRegistrados: number;
    reservasCreadas: number;
    promocionesEnviadas: number;
  };
  clientesRecientes?: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  email: string;
  telefono: string;
  fechaNacimiento: string | null;
  direccion: string | null;
  foto: string | null;
  huellaBiometrica: string | null;
  codigoAcceso: string;
  activo: boolean;
  empleado?: { id: string; nombre: string; cargo: string } | null;
  membresias?: {
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    membresia: { nombre: string; precio: number };
  }[];
  _count?: { accesos: number; reservas: number };
}

export interface Membresia {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionDias: number;
  beneficios: string | null;
  _count?: { clientesMembresia: number };
}

export interface MembresiaCliente {
  id: string;
  clienteId: string;
  membresiaId: string;
  fechaInicio: string;
  fechaFin: string;
  precioPagado: number;
  estado: string;
  cliente: Cliente;
  membresia: Membresia;
}

export interface Clase {
  id: string;
  nombre: string;
  descripcion: string | null;
  capacidad: number;
  duracion: number;
  instructor: string | null;
  diaSemana: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  _count?: { reservas: number };
}

export interface Reserva {
  id: string;
  clienteId: string;
  claseId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  cliente: { id: string; nombre: string; apellido: string; telefono: string };
  clase: Clase;
  empleado?: { id: string; nombre: string } | null;
}

export interface Acceso {
  id: string;
  clienteId: string;
  tipo: string;
  metodo: string;
  fechaHora: string;
  exitoso: boolean;
  notas: string | null;
  cliente: { id: string; nombre: string; apellido: string; foto: string | null; codigoAcceso: string };
  empleado?: { id: string; nombre: string } | null;
}

export interface Promocion {
  id: string;
  titulo: string;
  tipo: string;
  descuento: number;
  validoDesde: string;
  validoHasta: string;
  plantillaWhatsApp: string | null;
  activo: boolean;
  _count?: { envios: number };
}

export interface DashboardData {
  generales: {
    totalClientes: number;
    clientesNuevos: number;
    membresiasActivas: number;
    membresiasPorVencer: number;
    membresiasExpiradas: number;
    accesosHoy: number;
    reservasHoy: number;
    ingresosMes: number;
  };
  empleados: Empleado[];
  accesosPorDia: { fecha: string; dia: string; accesos: number }[];
  membresiasConCount: (Membresia & { count: number })[];
  clientesPorVencer: {
    id: string;
    fechaFin: string;
    cliente: { id: string; nombre: string; apellido: string; telefono: string; email: string };
    membresia: { nombre: string };
    contactoReciente?: {
      fecha: string;
      estado: string;
      haceDias: number;
    } | null;
  }[];
  clientesExpirados: {
    id: string;
    fechaFin: string;
    cliente: { id: string; nombre: string; apellido: string; telefono: string; email: string };
    membresia: { nombre: string };
    contactoReciente?: {
      fecha: string;
      estado: string;
      haceDias: number;
    } | null;
  }[];
  esAdmin?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  empleadoId?: string;
}

export interface SystemUser {
  id: string;
  email: string;
  rol: string;
  activo: boolean;
  empleado?: {
    id: string;
    nombre: string;
    cargo: string;
  } | null;
  createdAt: string;
}

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  icon?: React.ReactNode;
}

export interface AccesoResultado {
  exitoso: boolean;
  cliente?: { id: string; nombre: string; apellido: string; foto?: string };
  membresia?: {
    id: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    diasRestantes: number;
    expirada: boolean;
  };
  mensaje?: string;
}

// Form Types
export interface ClienteForm {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
  huellaBiometrica: string;
}

export interface MembresiaForm {
  clienteId: string;
  membresiaId: string;
  metodoPago: string;
  fechaInicio: string;
}

export interface ReservaForm {
  clienteId: string;
  claseId: string;
  fecha: string;
  notas: string;
}

export interface AccesoForm {
  codigoAcceso: string;
  tipo: string;
}

export interface UserForm {
  email: string;
  password: string;
  rol: string;
  empleadoId: string;
  activo: boolean;
  crearEmpleado: boolean;
  empleadoNombre: string;
  empleadoTelefono: string;
}

export interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export interface PlanForm {
  nombre: string;
  descripcion: string;
  precio: string;
  duracionDias: string;
  beneficios: string[];
}

export interface ClaseForm {
  nombre: string;
  descripcion: string;
  capacidad: string;
  duracion: string;
  instructor: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface PromocionNuevaForm {
  titulo: string;
  descripcion: string;
  tipo: string;
  descuento: string;
  validoDesde: string;
  validoHasta: string;
  plantillaWhatsApp: string;
}
