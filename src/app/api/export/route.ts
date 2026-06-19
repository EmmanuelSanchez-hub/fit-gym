import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Export data in different formats
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'export:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'clientes'; // clientes, membresias, accesos, ingresos, reservas, completo
    const format = searchParams.get('format') || 'json'; // json, csv
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    let data: Record<string, unknown>[] = [];
    let filename = type;

    switch (type) {
      case 'clientes':
        data = await exportClientes();
        filename = 'clientes';
        break;
      case 'membresias':
        data = await exportMembresias();
        filename = 'membresias';
        break;
      case 'accesos':
        data = await exportAccesos(fechaInicio, fechaFin);
        filename = 'accesos';
        break;
      case 'ingresos':
        data = await exportIngresos(fechaInicio, fechaFin);
        filename = 'ingresos';
        break;
      case 'reservas':
        data = await exportReservas(fechaInicio, fechaFin);
        filename = 'reservas';
        break;
      case 'completo':
        const completo = await exportCompleto(fechaInicio, fechaFin);
        return NextResponse.json(completo);
      case 'reporte-gerencial':
        const reporte = await exportReporteGerencial(fechaInicio, fechaFin);
        return NextResponse.json(reporte);
      default:
        return NextResponse.json({ error: 'Tipo de exportación no válido' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 });
  }
}

async function exportClientes() {
  const clientes = await db.cliente.findMany({
    include: {
      membresias: {
        where: { estado: 'activa' },
        include: { membresia: true },
        orderBy: { fechaFin: 'desc' },
        take: 1,
      },
      empleado: { select: { nombre: true } },
      _count: { select: { accesos: true, reservas: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return clientes.map((c) => ({
    Nombre: c.nombre,
    Apellido: c.apellido,
    DNI: c.dni || '',
    Email: c.email,
    Telefono: c.telefono,
    Direccion: c.direccion || '',
    Codigo_Acceso: c.codigoAcceso,
    Huella_Biometrica: c.huellaBiometrica || '',
    Activo: c.activo ? 'Sí' : 'No',
    Membresia_Actual: c.membresias[0]?.membresia.nombre || 'Sin membresía',
    Fecha_Inicio_Membresia: c.membresias[0]?.fechaInicio?.toISOString().split('T')[0] || '',
    Fecha_Fin_Membresia: c.membresias[0]?.fechaFin?.toISOString().split('T')[0] || '',
    Estado_Membresia: c.membresias[0]?.estado || '',
    Total_Accesos: c._count.accesos,
    Total_Reservas: c._count.reservas,
    Registrado_Por: c.empleado?.nombre || '',
    Fecha_Registro: c.createdAt.toISOString().split('T')[0],
  }));
}

async function exportMembresias() {
  const membresias = await db.membresiaCliente.findMany({
    include: {
      cliente: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      membresia: { select: { nombre: true, precio: true, duracionDias: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return membresias.map((m) => ({
    Cliente: `${m.cliente.nombre} ${m.cliente.apellido}`,
    Email: m.cliente.email,
    Telefono: m.cliente.telefono,
    Plan: m.membresia.nombre,
    Precio_Plan: m.membresia.precio,
    Duracion_Dias: m.membresia.duracionDias,
    Precio_Pagado: m.precioPagado,
    Metodo_Pago: m.metodoPago || '',
    Fecha_Inicio: m.fechaInicio.toISOString().split('T')[0],
    Fecha_Fin: m.fechaFin.toISOString().split('T')[0],
    Estado: m.estado,
    Notas: m.notas || '',
    Fecha_Registro: m.createdAt.toISOString().split('T')[0],
  }));
}

async function exportAccesos(fechaInicio?: string | null, fechaFin?: string | null) {
  const where: Record<string, unknown> = {};
  
  if (fechaInicio || fechaFin) {
    const fechaFilter: Record<string, Date> = {};
    if (fechaInicio) {
      const start = new Date(fechaInicio);
      start.setHours(0, 0, 0, 0);
      fechaFilter.gte = start;
    }
    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      fechaFilter.lte = end;
    }
    where.fechaHora = fechaFilter;
  }

  const accesos = await db.acceso.findMany({
    where,
    include: {
      cliente: { select: { nombre: true, apellido: true, codigoAcceso: true } },
      empleado: { select: { nombre: true } },
    },
    orderBy: { fechaHora: 'desc' },
    take: 5000,
  });

  return accesos.map((a) => ({
    Cliente: `${a.cliente.nombre} ${a.cliente.apellido}`,
    Codigo_Acceso: a.cliente.codigoAcceso,
    Tipo: a.tipo,
    Metodo: a.metodo,
    Fecha: a.fechaHora.toISOString().split('T')[0],
    Hora: a.fechaHora.toTimeString().split(' ')[0],
    Exitoso: a.exitoso ? 'Sí' : 'No',
    Validado_Por: a.empleado?.nombre || '',
    Notas: a.notas || '',
  }));
}

async function exportIngresos(fechaInicio?: string | null, fechaFin?: string | null) {
  const where: Record<string, unknown> = {};
  
  if (fechaInicio || fechaFin) {
    const fechaFilter: Record<string, Date> = {};
    if (fechaInicio) {
      const start = new Date(fechaInicio);
      start.setHours(0, 0, 0, 0);
      fechaFilter.gte = start;
    }
    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      fechaFilter.lte = end;
    }
    where.createdAt = fechaFilter;
  }

  const membresiasCliente = await db.membresiaCliente.findMany({
    where,
    include: {
      cliente: { select: { nombre: true, apellido: true, email: true } },
      membresia: { select: { nombre: true, precio: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return membresiasCliente.map((m) => ({
    Cliente: `${m.cliente.nombre} ${m.cliente.apellido}`,
    Email: m.cliente.email,
    Plan: m.membresia.nombre,
    Precio_Referencia: m.membresia.precio,
    Ingreso: m.precioPagado,
    Metodo_Pago: m.metodoPago || '',
    Fecha: m.createdAt.toISOString().split('T')[0],
    Estado: m.estado,
  }));
}

async function exportReservas(fechaInicio?: string | null, fechaFin?: string | null) {
  const where: Record<string, unknown> = {};
  
  if (fechaInicio || fechaFin) {
    const fechaFilter: Record<string, unknown> = {};
    if (fechaInicio) fechaFilter.gte = fechaInicio;
    if (fechaFin) fechaFilter.lte = fechaFin;
    where.fecha = fechaFilter;
  }

  const reservas = await db.reserva.findMany({
    where,
    include: {
      cliente: { select: { nombre: true, apellido: true, telefono: true } },
      clase: { select: { nombre: true, instructor: true, diaSemana: true, horaInicio: true } },
      empleado: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reservas.map((r) => ({
    Cliente: `${r.cliente.nombre} ${r.cliente.apellido}`,
    Telefono: r.cliente.telefono,
    Clase: r.clase.nombre,
    Instructor: r.clase.instructor || '',
    Dia_Semana: r.clase.diaSemana || '',
    Hora: r.clase.horaInicio || '',
    Fecha_Reserva: r.fecha.toISOString().split('T')[0],
    Estado: r.estado,
    Registrado_Por: r.empleado?.nombre || '',
    Notas: r.notas || '',
  }));
}

async function exportCompleto(fechaInicio?: string | null, fechaFin?: string | null) {
  const [clientes, membresias, accesos, ingresos, reservas] = await Promise.all([
    exportClientes(),
    exportMembresias(),
    exportAccesos(fechaInicio, fechaFin),
    exportIngresos(fechaInicio, fechaFin),
    exportReservas(fechaInicio, fechaFin),
  ]);

  return {
    fechaExportacion: new Date().toISOString(),
    periodo: {
      inicio: fechaInicio || 'Todos los tiempos',
      fin: fechaFin || 'Todos los tiempos',
    },
    resumen: {
      totalClientes: clientes.length,
      clientesActivos: clientes.filter(c => c.Activo === 'Sí').length,
      membresiasActivas: membresias.filter(m => m.Estado === 'activa').length,
      totalAccesos: accesos.length,
      accesosExitosos: accesos.filter(a => a.Exitoso === 'Sí').length,
      totalIngresos: ingresos.reduce((sum, i) => sum + (i.Ingreso as number), 0),
      totalReservas: reservas.length,
    },
    datos: {
      clientes,
      membresias,
      accesos,
      ingresos,
      reservas,
    },
  };
}

async function exportReporteGerencial(fechaInicio?: string | null, fechaFin?: string | null) {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  
  const periodoInicio = fechaInicio ? new Date(fechaInicio) : inicioMes;
  const periodoFin = fechaFin ? new Date(fechaFin) : finMes;

  // Obtener datos
  const [
    totalClientes,
    clientesNuevos,
    membresiasActivas,
    membresiasPorVencer,
    membresiasExpiradas,
    ingresosMes,
    accesosPeriodo,
    reservasPeriodo,
    ingresosPorPlan,
    ingresosPorMetodo,
  ] = await Promise.all([
    db.cliente.count({ where: { activo: true } }),
    db.cliente.count({
      where: { activo: true, createdAt: { gte: periodoInicio, lte: periodoFin } },
    }),
    db.membresiaCliente.count({ where: { estado: 'activa', fechaFin: { gte: hoy } } }),
    db.membresiaCliente.count({
      where: {
        estado: 'activa',
        fechaFin: { gte: hoy, lte: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.membresiaCliente.count({ where: { fechaFin: { lt: hoy } } }),
    db.membresiaCliente.aggregate({
      where: { createdAt: { gte: periodoInicio, lte: periodoFin } },
      _sum: { precioPagado: true },
    }),
    db.acceso.count({
      where: { fechaHora: { gte: periodoInicio, lte: periodoFin }, exitoso: true },
    }),
    db.reserva.count({
      where: {
        fecha: { gte: periodoInicio.toISOString().split('T')[0], lte: periodoFin.toISOString().split('T')[0] },
      },
    }),
    db.membresiaCliente.groupBy({
      by: ['membresiaId'],
      where: { createdAt: { gte: periodoInicio, lte: periodoFin } },
      _sum: { precioPagado: true },
      _count: true,
    }),
    db.membresiaCliente.groupBy({
      by: ['metodoPago'],
      where: { createdAt: { gte: periodoInicio, lte: periodoFin } },
      _sum: { precioPagado: true },
      _count: true,
    }),
  ]);

  // Obtener nombres de planes
  const planesIds = ingresosPorPlan.map(p => p.membresiaId).filter(Boolean) as string[];
  const planes = await db.membresia.findMany({
    where: { id: { in: planesIds } },
    select: { id: true, nombre: true },
  });
  const planesMap = new Map(planes.map(p => [p.id, p.nombre]));

  // Accesos por día (últimos 30 días) - usando query simple
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  
  const accesos = await db.acceso.findMany({
    where: { fechaHora: { gte: hace30Dias }, exitoso: true },
    select: { fechaHora: true },
  });

  const accesosPorDiaMap = new Map<string, number>();
  accesos.forEach(a => {
    const fecha = a.fechaHora.toISOString().split('T')[0];
    accesosPorDiaMap.set(fecha, (accesosPorDiaMap.get(fecha) || 0) + 1);
  });

  const tendenciaAccesos = Array.from(accesosPorDiaMap.entries())
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 7);

  return {
    titulo: 'Reporte Gerencial - Sistema de Gimnasio',
    fechaGeneracion: new Date().toISOString(),
    periodo: {
      inicio: periodoInicio.toISOString().split('T')[0],
      fin: periodoFin.toISOString().split('T')[0],
    },
    metricasGenerales: {
      totalClientes,
      clientesNuevosPeriodo: clientesNuevos,
      crecimientoClientes: totalClientes > 0 ? ((clientesNuevos / totalClientes) * 100).toFixed(2) + '%' : '0%',
      membresiasActivas,
      membresiasPorVencer,
      membresiasExpiradas,
      tasaRenovacion: membresiasActivas > 0 
        ? (((membresiasActivas - membresiasExpiradas) / membresiasActivas) * 100).toFixed(2) + '%' 
        : '0%',
    },
    ingresos: {
      totalPeriodo: ingresosMes._sum.precioPagado || 0,
      porPlan: ingresosPorPlan.map(p => ({
        plan: planesMap.get(p.membresiaId!) || 'Desconocido',
        cantidad: p._count,
        total: p._sum.precioPagado || 0,
      })),
      porMetodoPago: ingresosPorMetodo.map(m => ({
        metodo: m.metodoPago || 'No especificado',
        cantidad: m._count,
        total: m._sum.precioPagado || 0,
      })),
    },
    actividad: {
      accesosPeriodo,
      reservasPeriodo,
      promedioAccesosDiario: tendenciaAccesos.length > 0 
        ? (accesosPeriodo / tendenciaAccesos.length).toFixed(1) 
        : '0',
      tendenciaAccesos,
    },
    recomendaciones: generarRecomendaciones({
      membresiasPorVencer,
      membresiasExpiradas,
      clientesNuevos,
      totalClientes,
    }),
  };
}

function generarRecomendaciones(data: { membresiasPorVencer: number; membresiasExpiradas: number; clientesNuevos: number; totalClientes: number }) {
  const recomendaciones = [];
  
  if (data.membresiasPorVencer > 0) {
    recomendaciones.push({
      tipo: 'urgente',
      titulo: 'Membresías por vencer',
      descripcion: `Hay ${data.membresiasPorVencer} membresías que vencen en los próximos 7 días. Contactar a estos clientes para renovación.`,
      accion: 'Enviar promociones de renovación',
    });
  }
  
  if (data.membresiasExpiradas > 0) {
    recomendaciones.push({
      tipo: 'importante',
      titulo: 'Membresías expiradas',
      descripcion: `Hay ${data.membresiasExpiradas} clientes con membresías vencidas. Oportunidad de reactivación.`,
      accion: 'Campaña de reactivación con descuentos especiales',
    });
  }
  
  if (data.clientesNuevos < data.totalClientes * 0.05) {
    recomendaciones.push({
      tipo: 'sugerencia',
      titulo: 'Crecimiento de clientes',
      descripcion: 'El crecimiento de nuevos clientes es bajo este período.',
      accion: 'Considerar aumentar promociones o referidos',
    });
  }
  
  return recomendaciones;
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}
