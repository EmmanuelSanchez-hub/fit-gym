import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Obtener notificaciones
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'dashboard:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);

    const notifications = [];

    // 1. Membresías por vencer (próximos 7 días)
    const membresiasPorVencer = await db.membresiaCliente.findMany({
      where: {
        estado: 'activa',
        fechaFin: { gte: hoy, lte: en7Dias },
      },
      include: {
        cliente: { select: { nombre: true, apellido: true } },
        membresia: { select: { nombre: true } },
      },
      take: 5,
    });

    membresiasPorVencer.forEach(m => {
      const diasRestantes = Math.ceil((new Date(m.fechaFin).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `vencer-${m.id}`,
        tipo: 'warning',
        titulo: 'Membresía por vencer',
        mensaje: `${m.cliente.nombre} ${m.cliente.apellido} - ${m.membresia.nombre} vence en ${diasRestantes} días`,
        fecha: new Date().toISOString(),
        leida: false,
        clienteId: m.clienteId,
      });
    });

    // 2. Membresías expiradas
    const membresiasExpiradas = await db.membresiaCliente.findMany({
      where: {
        estado: 'activa',
        fechaFin: { lt: hoy },
      },
      include: {
        cliente: { select: { nombre: true, apellido: true } },
        membresia: { select: { nombre: true } },
      },
      take: 5,
    });

    membresiasExpiradas.forEach(m => {
      notifications.push({
        id: `expirada-${m.id}`,
        tipo: 'error',
        titulo: 'Membresía expirada',
        mensaje: `${m.cliente.nombre} ${m.cliente.apellido} - ${m.membresia.nombre} ha expirado`,
        fecha: new Date().toISOString(),
        leida: false,
        clienteId: m.clienteId,
      });
    });

    // 3. Reservas para hoy
    const reservasHoy = await db.reserva.count({
      where: {
        fecha: { gte: hoy },
        estado: 'confirmada',
      },
    });

    if (reservasHoy > 0) {
      notifications.push({
        id: 'reservas-hoy',
        tipo: 'info',
        titulo: 'Reservas del día',
        mensaje: `Hay ${reservasHoy} reservas confirmadas para hoy`,
        fecha: new Date().toISOString(),
        leida: false,
      });
    }

    // 4. Cumpleaños hoy (si hay clientes con fecha de nacimiento)
    const clientesCumple = await db.cliente.findMany({
      where: {
        activo: true,
        fechaNacimiento: { not: null },
      },
    });

    const cumpleanerosHoy = clientesCumple.filter(c => {
      if (!c.fechaNacimiento) return false;
      const fechaNac = new Date(c.fechaNacimiento);
      return fechaNac.getMonth() === hoy.getMonth() && fechaNac.getDate() === hoy.getDate();
    });

    if (cumpleanerosHoy.length > 0) {
      notifications.push({
        id: 'cumpleanos-hoy',
        tipo: 'success',
        titulo: 'Cumpleaños hoy',
        mensaje: `${cumpleanerosHoy.length} cliente(s) cumplen años hoy: ${cumpleanerosHoy.map(c => c.nombre).join(', ')}`,
        fecha: new Date().toISOString(),
        leida: false,
      });
    }

    // Ordenar por tipo (error primero, luego warning, luego info)
    const ordenPrioridad = { error: 0, warning: 1, info: 2, success: 3 };
    notifications.sort((a, b) => ordenPrioridad[a.tipo as keyof typeof ordenPrioridad] - ordenPrioridad[b.tipo as keyof typeof ordenPrioridad]);

    return NextResponse.json({
      notifications: notifications.slice(0, limit),
      total: notifications.length,
      noLeidas: notifications.filter(n => !n.leida).length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [], total: 0, noLeidas: 0 });
  }
}
