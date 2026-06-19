import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Métricas del dashboard (con soporte para roles)
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'dashboard:read');
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  
  try {
    const userRol = user.rol;
    const userEmpleadoId = user.empleadoId;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    // 1. Creamos el objeto Date de hoy y lo ponemos a medianoche
const fechaHoy = new Date();
fechaHoy.setHours(0, 0, 0, 0);

// 2. Obtenemos el timestamp numérico para comparar con la DB
const hoyTimestamp = fechaHoy.getTime();

// 3. Calculamos hace 30 días (opcional, si lo necesitas para otra lógica)
const fechaHace30Dias = new Date(fechaHoy);
fechaHace30Dias.setDate(fechaHace30Dias.getDate() - 30);
const hace30DiasTimestamp = fechaHace30Dias.getTime();
    
    const esAdminO_superUsuario = userRol === 'SUPER_USUARIO' || userRol === 'ADMINISTRADOR';
    
    // Métricas generales (todos las ven)
    const totalClientes = await db.cliente.count({ where: { activo: true } });
    const clientesNuevos = await db.cliente.count({
      where: { createdAt: { gte: hace30Dias } },
    });
    
    // Membresías activas y por vencer
    const membresiasActivas = await db.membresiaCliente.count({
      where: { estado: 'activa', fechaFin: { gte: hoy } },
    });
    
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    const membresiasPorVencer = await db.membresiaCliente.count({
      where: {
        estado: 'activa',
        fechaFin: { gte: hoy, lte: en7Dias },
      },
    });
    
    const membresiasExpiradas = await db.membresiaCliente.count({
      where: {
        estado: 'activa',
        fechaFin: { lt: hoy },
      },
    });
    
    // Accesos de hoy (filtrados por rol)
    const accesosHoyWhere: { fechaHora: { gte: Date }; exitoso: boolean; empleadoId?: string } = {
      fechaHora: { gte: hoy },
      exitoso: true,
    };
    if (!esAdminO_superUsuario && userEmpleadoId) {
      accesosHoyWhere.empleadoId = userEmpleadoId;
    }
    const accesosHoy = await db.acceso.count({ where: accesosHoyWhere });
    
    // Reservas de hoy
    const reservasHoy = await db.reserva.count({
      where: {
        fecha: { gte: hoy },
        estado: 'confirmada',
      },
    });
    
    // Métricas por empleado (admin/superusuario ven todos)
    let empleados;
    if (esAdminO_superUsuario) {
      empleados = await db.empleado.findMany({
        where: { activo: true },
        include: {
          _count: {
            select: {
              clientesRegistrados: true,
              accesosRegistrados: true,
              reservasCreadas: true,
              promocionesEnviadas: true,
            },
          },
        },
      });
    } else if (userEmpleadoId) {
      // Otros roles solo ven sus propias métricas
      empleados = await db.empleado.findMany({
        where: { id: userEmpleadoId, activo: true },
        include: {
          _count: {
            select: {
              clientesRegistrados: true,
              accesosRegistrados: true,
              reservasCreadas: true,
              promocionesEnviadas: true,
            },
          },
        },
      });
    } else {
      empleados = [];
    }
    
    // Clientes registrados por empleado en los últimos 30 días
    const empleadosConClientesRecientes = await Promise.all(
      empleados.map(async (empleado) => {
        const clientesRecientes = await db.cliente.count({
          where: {
            registradoPor: empleado.id,
            createdAt: { gte: hace30Dias },
          },
        });
        return {
          ...empleado,
          clientesRecientes,
        };
      })
    );
    
    // Ingresos del mes (solo admin/superusuario)
    let ingresosMes = 0;
    if (esAdminO_superUsuario) {
      const ingresos = await db.membresiaCliente.aggregate({
        where: {
          fechaInicio: { gte: hace30Dias },
        },
        _sum: {
          precioPagado: true,
        },
      });
      ingresosMes = ingresos._sum.precioPagado || 0;
    }
    
    // Accesos por día (últimos 7 días) - filtrado por rol
    const accesosPorDia = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      const whereClause: { fechaHora: { gte: Date; lte: Date }; exitoso: boolean; empleadoId?: string } = {
        fechaHora: { gte: fecha, lte: fechaFin },
        exitoso: true,
      };
      if (!esAdminO_superUsuario && userEmpleadoId) {
        whereClause.empleadoId = userEmpleadoId;
      }
      
      const count = await db.acceso.count({ where: whereClause });
      
      accesosPorDia.push({
        fecha: fecha.toISOString().split('T')[0],
        dia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        accesos: count,
      });
    }
    
    // Distribución de membresías (solo admin/superusuario)
    let membresiasConCount: { nombre: string; count: number }[] = [];
    if (esAdminO_superUsuario) {
      const distribucionMembresias = await db.membresiaCliente.groupBy({
        by: ['membresiaId'],
        where: { estado: 'activa', fechaFin: { gte: hoy } },
        _count: true,
      });
      
      const membresias = await db.membresia.findMany();
      membresiasConCount = distribucionMembresias.map(m => ({
        nombre: membresias.find(mem => mem.id === m.membresiaId)?.nombre || '',
        count: m._count,
      }));
    }
    
    // Clientes con membresías por vencer (próximos 7 días)
    const clientesPorVencer = await db.membresiaCliente.findMany({
      where: {
        estado: 'activa',
        fechaFin: { gte: hoy, lte: en7Dias },
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, telefono: true, email: true },
        },
        membresia: { select: { nombre: true } },
      },
      orderBy: { fechaFin: 'asc' },
      take: 10,
    });
    
    // Clientes con membresías expiradas
    const clientesExpirados = await db.membresiaCliente.findMany({
      where: {
        estado: 'activa',
        fechaFin: { lt: hoy },
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, telefono: true, email: true },
        },
        membresia: { select: { nombre: true } },
      },
      orderBy: { fechaFin: 'desc' },
      take: 10,
    });
    console.log("clientesExpirados:", clientesExpirados);
    console.log("cantidad:", clientesExpirados.length);
    
    // Obtener IDs de clientes por vencer y expirados
    const clientesIdsPorVencer = clientesPorVencer.map(m => m.cliente.id);
    const clientesIdsExpirados = clientesExpirados.map(m => m.cliente.id);
    const todosClientesIds = [...clientesIdsPorVencer, ...clientesIdsExpirados];
    
    // Obtener últimos contactos (promociones enviadas en los últimos 2 días)
    const hace2Dias = new Date(hoy);
    hace2Dias.setDate(hace2Dias.getDate() - 2);
    
    const ultimosContactos = await db.promocionEnviada.findMany({
      where: {
        clienteId: { in: todosClientesIds },
        fechaEnvio: { gte: hace2Dias },
      },
      select: {
        clienteId: true,
        fechaEnvio: true,
        estado: true,
      },
      orderBy: { fechaEnvio: 'desc' },
    });
    
    // Crear mapa de últimos contactos por cliente
    const contactoMap = new Map<string, { fecha: Date; estado: string }>();
    ultimosContactos.forEach(c => {
      if (!contactoMap.has(c.clienteId)) {
        contactoMap.set(c.clienteId, { fecha: c.fechaEnvio, estado: c.estado });
      }
    });
    
    // Función para agregar info de contacto
    const addContactInfo = (m: { id: string; fechaFin: Date; cliente: { id: string; nombre: string; apellido: string; telefono: string; email: string }; membresia: { nombre: string } }) => {
      const ultimoContacto = contactoMap.get(m.cliente.id);
      return {
        id: m.id,
        fechaFin: m.fechaFin,
        cliente: m.cliente,
        membresia: m.membresia,
        contactoReciente: ultimoContacto ? {
          fecha: ultimoContacto.fecha,
          estado: ultimoContacto.estado,
          haceDias: Math.floor((hoy.getTime() - new Date(ultimoContacto.fecha).getTime()) / (1000 * 60 * 60 * 24)),
        } : null,
      };
    };
    
    return NextResponse.json({
      generales: {
        totalClientes,
        clientesNuevos,
        membresiasActivas,
        membresiasPorVencer,
        membresiasExpiradas,
        accesosHoy,
        reservasHoy,
        ingresosMes,
      },
      empleados: empleadosConClientesRecientes,
      accesosPorDia,
      membresiasConCount,
      clientesPorVencer: clientesPorVencer.map(addContactInfo),
      clientesExpirados: clientesExpirados.map(addContactInfo),
      esAdmin: esAdminO_superUsuario,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}
