import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcrypt';
import { requireAuth } from '@/lib/auth-helpers';

// ============================================
// CONSTANTES DE DATOS DE DEMOSTRACIÓN
// ============================================

const DEFAULT_PASSWORD = 'demo123';

const PLANES_MEMBRESIA = [
  {
    nombre: 'Mensual Básico',
    descripcion: 'Acceso a sala de pesas y zona cardio',
    precio: 80,
    duracionDias: 30,
    beneficios: ['Sala de pesas', 'Zona cardio', 'Lockers', 'Duchas'],
  },
  {
    nombre: 'Mensual Premium',
    descripcion: 'Acceso completo con clases grupales incluidas',
    precio: 120,
    duracionDias: 30,
    beneficios: ['Sala de pesas', 'Zona cardio', 'Clases grupales', 'Lockers premium', 'Toalla'],
  },
  {
    nombre: 'Trimestral',
    descripcion: '3 meses de acceso completo con beneficios extra',
    precio: 300,
    duracionDias: 90,
    beneficios: ['Acceso completo', 'Clases ilimitadas', 'Evaluación física mensual', 'Nutricionista 1 vez'],
  },
  {
    nombre: 'Anual VIP',
    descripcion: '12 meses con todos los beneficios premium',
    precio: 900,
    duracionDias: 365,
    beneficios: ['Acceso 24/7', 'Clases ilimitadas', 'Entrenador personal', 'Nutricionista mensual', 'Spa', 'Estacionamiento'],
  },
];

const USUARIOS_DEMO = [
  {
    nombre: 'Super Admin',
    email: 'super@gym.com',
    cargo: 'Super Administrador',
    rol: 'SUPER_USUARIO' as const,
  },
  {
    nombre: 'María García',
    email: 'maria@gym.com',
    cargo: 'Administrador',
    rol: 'ADMINISTRADOR' as const,
  },
  {
    nombre: 'Carlos López',
    email: 'carlos@gym.com',
    cargo: 'Recepcionista',
    rol: 'RECEPCIONISTA' as const,
  },
  {
    nombre: 'Ana Martínez',
    email: 'ana@gym.com',
    cargo: 'Entrenador',
    rol: 'ENTRENADOR' as const,
  },
  {
    nombre: 'Pedro Sánchez',
    email: 'pedro@gym.com',
    cargo: 'Entrenador',
    rol: 'ENTRENADOR' as const,
  },
];

const CLIENTES_DEMO = [
  { nombre: 'Juan', apellido: 'Pérez', dni: '12345678', email: 'juan@email.com', telefono: '999888777', fechaNacimiento: '1990-05-15', direccion: 'Av. Los Olivos 123' },
  { nombre: 'Laura', apellido: 'Gómez', dni: '12345679', email: 'laura@email.com', telefono: '999888776', fechaNacimiento: '1992-08-22', direccion: 'Jr. Las Flores 456' },
  { nombre: 'Roberto', apellido: 'Díaz', dni: '12345680', email: 'roberto@email.com', telefono: '999888775', fechaNacimiento: '1988-03-10', direccion: 'Calle Principal 789' },
  { nombre: 'Sofía', apellido: 'Rodríguez', dni: '12345681', email: 'sofia@email.com', telefono: '999888774', fechaNacimiento: '1995-11-28', direccion: 'Av. San Martín 321' },
  { nombre: 'Miguel', apellido: 'Torres', dni: '12345682', email: 'miguel@email.com', telefono: '999888773', fechaNacimiento: '1991-07-03', direccion: 'Urb. Los Pinos Mz A Lt 1' },
  { nombre: 'Carmen', apellido: 'Ruiz', dni: '12345683', email: 'carmen@email.com', telefono: '999888772', fechaNacimiento: '1987-12-19', direccion: 'Av. Grau 654' },
  { nombre: 'Diego', apellido: 'Hernández', dni: '12345684', email: 'diego@email.com', telefono: '999888771', fechaNacimiento: '1993-04-05', direccion: 'Jr. Comercio 987' },
  { nombre: 'Valentina', apellido: 'Morales', dni: '12345685', email: 'valentina@email.com', telefono: '999888770', fechaNacimiento: '1996-09-14', direccion: 'Av. Arequipa 159' },
  { nombre: 'Andrés', apellido: 'Castro', dni: '12345686', email: 'andres@email.com', telefono: '999888769', fechaNacimiento: '1989-01-25', direccion: 'Calle Los Álamos 753' },
  { nombre: 'Isabella', apellido: 'Vargas', dni: '12345687', email: 'isabella@email.com', telefono: '999888768', fechaNacimiento: '1994-06-30', direccion: 'Av. Brasil 852' },
  { nombre: 'Fernando', apellido: 'Mendoza', dni: '12345688', email: 'fernando@email.com', telefono: '999888767', fechaNacimiento: '1986-10-08', direccion: 'Jr. Lima 963' },
  { nombre: 'Lucía', apellido: 'Flores', dni: '12345689', email: 'lucia@email.com', telefono: '999888766', fechaNacimiento: '1997-02-17', direccion: 'Av. Tacna 147' },
];

const CLASES_DEMO = [
  { nombre: 'Spinning', descripcion: 'Ciclismo indoor de alta intensidad', capacidad: 20, duracion: 45, instructor: 'Ana Martínez', diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '08:45' },
  { nombre: 'Yoga', descripcion: 'Yoga relajante para principiantes y avanzados', capacidad: 15, duracion: 60, instructor: 'Ana Martínez', diaSemana: 'Martes', horaInicio: '18:00', horaFin: '19:00' },
  { nombre: 'CrossFit', descripcion: 'Entrenamiento funcional de alta intensidad', capacidad: 12, duracion: 60, instructor: 'Pedro Sánchez', diaSemana: 'Miércoles', horaInicio: '07:00', horaFin: '08:00' },
  { nombre: 'Pilates', descripcion: 'Fortalecimiento del core y flexibilidad', capacidad: 18, duracion: 50, instructor: 'Ana Martínez', diaSemana: 'Jueves', horaInicio: '17:00', horaFin: '17:50' },
  { nombre: 'Box', descripcion: 'Técnicas de box y acondicionamiento', capacidad: 10, duracion: 60, instructor: 'Pedro Sánchez', diaSemana: 'Viernes', horaInicio: '19:00', horaFin: '20:00' },
  { nombre: 'Zumba', descripcion: 'Baile y fitness latino', capacidad: 25, duracion: 50, instructor: 'María García', diaSemana: 'Sábado', horaInicio: '10:00', horaFin: '10:50' },
];

const PROMOCIONES_DEMO = [
  {
    titulo: '¡Renueva tu membresía con 20% OFF!',
    tipo: 'vencimiento_proximo',
    descuento: 20,
    diasValidez: 30,
    plantillaWhatsApp: '¡Hola {nombre}! Tu membresía está por vencer en {dias} días. Renueva ahora con 20% de descuento. ¡No te lo pierdas!',
  },
  {
    titulo: '¡Te extrañamos! Regresa con 30% OFF',
    tipo: 'membresia_expirada',
    descuento: 30,
    diasValidez: 15,
    plantillaWhatsApp: '¡Hola {nombre}! Tu membresía ha expirado hace {dias} días. Regresa al gimnasio con un 30% de descuento. ¡Te esperamos!',
  },
  {
    titulo: '¡Bienvenido! Primera membresía 15% OFF',
    tipo: 'bienvenida',
    descuento: 15,
    diasValidez: 7,
    plantillaWhatsApp: '¡Hola {nombre}! Bienvenido a nuestro gimnasio. Obtén un 15% de descuento en tu primera membresía.',
  },
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function generarCodigoAcceso(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generarHuellaBiometrica(index: number): string {
  return `BH${String(index + 1).padStart(6, '0')}`;
}

function fechaAleatoria(diasBase: number, variacion: number = 0): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasBase + (variacion > 0 ? Math.floor(Math.random() * variacion) : 0));
  return fecha;
}

// ============================================
// FUNCIÓN PRINCIPAL DE SEED
// ============================================

export async function POST(request: NextRequest) {
  // Verificar autenticación - solo SUPER_USUARIO puede ejecutar seed
  const authResult = await requireAuth(request, 'seed:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const hashedPassword = await hash(DEFAULT_PASSWORD, 10);
    const hoy = new Date();
    
    // 1. Crear empleados y usuarios de demostración
    const empleadosCreados = [];
    const usuariosCreados = [];
    
    for (const userData of USUARIOS_DEMO) {
      // Verificar si ya existe
      const existingUser = await db.user.findUnique({
        where: { email: userData.email },
      });
      
      if (existingUser) {
        // Si ya existe, obtener el empleado asociado
        const existingEmpleado = await db.empleado.findUnique({
          where: { email: userData.email },
        });
        if (existingEmpleado) {
          empleadosCreados.push(existingEmpleado);
        }
        usuariosCreados.push(existingUser);
        continue;
      }
      
      // Crear empleado
      const empleado = await db.empleado.create({
        data: {
          nombre: userData.nombre,
          email: userData.email,
          cargo: userData.cargo,
          activo: true,
        },
      });
      empleadosCreados.push(empleado);
      
      // Crear usuario vinculado al empleado
      const user = await db.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          rol: userData.rol,
          empleadoId: empleado.id,
          activo: true,
        },
      });
      usuariosCreados.push(user);
    }

    // 2. Crear planes de membresía
    const membresias = await Promise.all(
      PLANES_MEMBRESIA.map(plan =>
        db.membresia.create({
          data: {
            nombre: plan.nombre,
            descripcion: plan.descripcion,
            precio: plan.precio,
            duracionDias: plan.duracionDias,
            beneficios: JSON.stringify(plan.beneficios),
          },
        })
      )
    );

    // 3. Crear clientes (distribuidos entre empleados recepcionistas y admin)
    const empleadosAsignacion = empleadosCreados.filter(e => 
      e.cargo === 'Recepcionista' || e.cargo === 'Administrador' || e.cargo === 'Super Administrador'
    );
    
    const clientes = await Promise.all(
      CLIENTES_DEMO.map((clienteData, index) => {
        const empleadoAsignado = empleadosAsignacion[index % empleadosAsignacion.length];
        return db.cliente.create({
          data: {
            nombre: clienteData.nombre,
            apellido: clienteData.apellido,
            dni: clienteData.dni,
            email: clienteData.email,
            telefono: clienteData.telefono,
            fechaNacimiento: clienteData.fechaNacimiento ? new Date(clienteData.fechaNacimiento) : null,
            direccion: clienteData.direccion,
            codigoAcceso: generarCodigoAcceso(),
            huellaBiometrica: generarHuellaBiometrica(index),
            registradoPor: empleadoAsignado?.id || null,
          },
        });
      })
    );

    // 4. Crear membresías de clientes con diferentes estados
    const membresiasClientesData: Promise<any>[] = [];
    
    // Clientes 0-3: Membresías activas (vencen en 20+ días)
    for (let i = 0; i < 4; i++) {
      membresiasClientesData.push(
        db.membresiaCliente.create({
          data: {
            clienteId: clientes[i].id,
            membresiaId: membresias[Math.floor(Math.random() * 2)].id,
            fechaFin: fechaAleatoria(25, 10),
            precioPagado: PLANES_MEMBRESIA[Math.floor(Math.random() * 2)].precio,
            metodoPago: ['Efectivo', 'Tarjeta', 'Yape', 'Plin'][Math.floor(Math.random() * 4)],
          },
        })
      );
    }
    
    // Clientes 4-7: Membresías por vencer (dentro de 7 días)
    for (let i = 4; i < 8; i++) {
      membresiasClientesData.push(
        db.membresiaCliente.create({
          data: {
            clienteId: clientes[i].id,
            membresiaId: membresias[Math.floor(Math.random() * 2)].id,
            fechaFin: fechaAleatoria(1, 6),
            precioPagado: PLANES_MEMBRESIA[Math.floor(Math.random() * 2)].precio,
            metodoPago: ['Efectivo', 'Tarjeta', 'Yape'][Math.floor(Math.random() * 3)],
          },
        })
      );
    }
    
    // Clientes 8-11: Membresías expiradas
    for (let i = 8; i < 12; i++) {
      membresiasClientesData.push(
        db.membresiaCliente.create({
          data: {
            clienteId: clientes[i].id,
            membresiaId: membresias[Math.floor(Math.random() * 2)].id,
            fechaFin: fechaAleatoria(-15, 15),
            precioPagado: PLANES_MEMBRESIA[Math.floor(Math.random() * 2)].precio,
            metodoPago: ['Efectivo', 'Tarjeta'][Math.floor(Math.random() * 2)],
            estado: 'vencida',
          },
        })
      );
    }
    
    const membresiasClientes = await Promise.all(membresiasClientesData);

    // 5. Crear clases
    const clases = await Promise.all(
      CLASES_DEMO.map(clase =>
        db.clase.create({
          data: clase,
        })
      )
    );

    // 6. Crear promociones
    const promociones = await Promise.all(
      PROMOCIONES_DEMO.map(promo =>
        db.promocion.create({
          data: {
            titulo: promo.titulo,
            tipo: promo.tipo,
            descuento: promo.descuento,
            validoDesde: hoy,
            validoHasta: fechaAleatoria(promo.diasValidez),
            plantillaWhatsApp: promo.plantillaWhatsApp,
          },
        })
      )
    );

    // 7. Crear accesos de demostración (últimos 7 días)
    const accesosData: Promise<any>[] = [];
    const metodosAcceso = ['biometrico', 'codigo', 'manual'] as const;
    
    for (let i = 0; i < 50; i++) {
      const fechaHora = new Date(hoy);
      fechaHora.setDate(fechaHora.getDate() - Math.floor(Math.random() * 7));
      fechaHora.setHours(6 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60));
      
      accesosData.push(
        db.acceso.create({
          data: {
            clienteId: clientes[Math.floor(Math.random() * clientes.length)].id,
            empleadoId: empleadosCreados[Math.floor(Math.random() * empleadosCreados.length)].id,
            tipo: i % 4 === 0 ? 'salida' : 'entrada',
            metodo: metodosAcceso[Math.floor(Math.random() * metodosAcceso.length)],
            fechaHora,
            exitoso: Math.random() > 0.1, // 90% exitosos
          },
        })
      );
    }
    const accesos = await Promise.all(accesosData);

    // 8. Crear reservas de demostración
    const reservasData: Promise<any>[] = [];
    
    for (let i = 0; i < 20; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 7));
      const clase = clases[Math.floor(Math.random() * clases.length)];
      
      reservasData.push(
        db.reserva.create({
          data: {
            clienteId: clientes[Math.floor(Math.random() * clientes.length)].id,
            claseId: clase.id,
            empleadoId: empleadosCreados[Math.floor(Math.random() * empleadosCreados.length)].id,
            fecha,
            horaInicio: clase.horaInicio || '08:00',
            horaFin: clase.horaFin || '09:00',
          },
        })
      );
    }
    const reservas = await Promise.all(reservasData);

    return NextResponse.json({
      success: true,
      message: 'Base de datos poblada exitosamente',
      credentials: {
        note: 'Todos los usuarios tienen la misma contraseña',
        password: DEFAULT_PASSWORD,
        users: USUARIOS_DEMO.map(u => ({ email: u.email, rol: u.rol })),
      },
      stats: {
        usuarios: usuariosCreados.length,
        empleados: empleadosCreados.length,
        clientes: clientes.length,
        planesMembresia: membresias.length,
        membresiasActivas: membresiasClientes.length,
        clases: clases.length,
        promociones: promociones.length,
        accesos: accesos.length,
        reservas: reservas.length,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Error al poblar la base de datos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
