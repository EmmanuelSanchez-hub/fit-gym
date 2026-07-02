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
    const hace15Dias = new Date(hoy);
    hace15Dias.setDate(hace15Dias.getDate() - 15);
    const hace60Dias = new Date(hoy);
    hace60Dias.setDate(hace60Dias.getDate() - 60);
    
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

    // Tasa de retención: de los clientes con membresía vencida en 60 días, ¿cuántos renovaron?
    const membresiasVencidasEnPeriodo = await db.membresiaCliente.count({
      where: { fechaFin: { gte: hace60Dias, lt: hoy } },
    });
    // IDs de clientes que tuvieron una membresía vencida en el período
    const clientesConVencidas = await db.membresiaCliente.findMany({
      where: { fechaFin: { gte: hace60Dias, lt: hoy } },
      select: { clienteId: true },
      distinct: ['clienteId'],
    });
    const idsVencidos = clientesConVencidas.map(m => m.clienteId);
    // De esos clientes, cuántos iniciaron una nueva membresía en los últimos 60 días
    const membresiasRenovadasEnPeriodo = idsVencidos.length > 0
      ? await db.membresiaCliente.count({
          where: { clienteId: { in: idsVencidos }, fechaInicio: { gte: hace60Dias } },
        })
      : 0;
    const tasaRetencion = membresiasVencidasEnPeriodo > 0
      ? Math.min(100, Math.round((membresiasRenovadasEnPeriodo / membresiasVencidasEnPeriodo) * 100))
      : 100;

    // Clientes en riesgo: activos que no han tenido acceso en 15+ días
    const clientesConAccesoReciente = await db.acceso.findMany({
      where: { fechaHora: { gte: hace15Dias }, exitoso: true },
      select: { clienteId: true },
      distinct: ['clienteId'],
    });
    const idsConAccesoReciente = clientesConAccesoReciente.map(a => a.clienteId);
    const clientesEnRiesgo = await db.cliente.count({
      where: { activo: true, id: { notIn: idsConAccesoReciente } },
      // Solo contar los que tienen membresía activa
    });
    // Refinamos: clientes en riesgo = con membresía activa que no han ido en 15 días
    const membresiasActivasIds = await db.membresiaCliente.findMany({
      where: { estado: 'activa', fechaFin: { gte: hoy } },
      select: { clienteId: true },
      distinct: ['clienteId'],
    });
    const idsMembresiaActiva = membresiasActivasIds.map(m => m.clienteId);
    const clientesEnRiesgoReal = idsMembresiaActiva.filter(id => !idsConAccesoReciente.includes(id)).length;

    // Accesos por hora del día (hoy)
    const accesosDelDia = await db.acceso.findMany({
      where: { fechaHora: { gte: hoy }, exitoso: true },
      select: { fechaHora: true },
    });
    const accesosPorHora = Array.from({ length: 24 }, (_, hora) => ({
      hora: `${hora}:00`,
      accesos: accesosDelDia.filter(a => new Date(a.fechaHora).getHours() === hora).length,
    }));
    
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
      // Excluir al super usuario de las métricas por empleado
      empleados = await db.empleado.findMany({
        where: { activo: true, email: { not: 'super@gym.com' } },
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
    const accesosPorDia: { fecha: string; dia: string; accesos: number }[] = [];
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
        tasaRetencion,
        clientesEnRiesgo: clientesEnRiesgoReal,
      },
      accesosPorHora,
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
