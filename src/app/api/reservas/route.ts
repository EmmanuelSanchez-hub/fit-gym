import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar reservas
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'reservas:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const clienteId = searchParams.get('clienteId');
    const estado = searchParams.get('estado');
    
    const where: Record<string, unknown> = {};
    
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      where.fecha = { gte: fechaInicio, lte: fechaFin };
    }
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;
    
    const reservas = await db.reserva.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        clase: true,
        empleado: { select: { id: true, nombre: true } },
      },
    });
    
    return NextResponse.json(reservas);
  } catch (error) {
    console.error('Error fetching reservas:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}

// POST - Crear reserva
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'reservas:create');
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  
  try {
    const data = await request.json();
    
    // Verificar capacidad
    const clase = await db.clase.findUnique({
      where: { id: data.claseId },
      include: {
        _count: {
          select: {
            reservas: {
              where: {
                fecha: new Date(data.fecha),
                estado: 'confirmada',
              },
            },
          },
        },
      },
    });
    
    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }
    
    if (clase._count.reservas >= clase.capacidad) {
      return NextResponse.json({ error: 'La clase está llena' }, { status: 400 });
    }
    
    const reserva = await db.reserva.create({
      data: {
        clienteId: data.clienteId,
        claseId: data.claseId,
        empleadoId: user.empleadoId || data.empleadoId,
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        notas: data.notas,
      },
      include: {
        cliente: true,
        clase: true,
      },
    });
    
    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    console.error('Error creating reserva:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
