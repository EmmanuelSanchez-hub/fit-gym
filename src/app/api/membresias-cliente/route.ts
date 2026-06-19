import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar membresías de clientes
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'membresias-cliente:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const proximosAVencer = searchParams.get('proximosAVencer') === 'true';
    const expirados = searchParams.get('expirados') === 'true';
    
    const where: Record<string, unknown> = {};
    
    if (estado) where.estado = estado;
    if (clienteId) where.clienteId = clienteId;
    
    // Filtrar por próximos a vencer (dentro de 7 días)
    if (proximosAVencer) {
      const hoy = new Date();
      const en7Dias = new Date();
      en7Dias.setDate(hoy.getDate() + 7);
      where.fechaFin = { gte: hoy, lte: en7Dias };
      where.estado = 'activa';
    }
    
    // Filtrar por expirados
    if (expirados) {
      const hoy = new Date();
      where.fechaFin = { lt: hoy };
      where.estado = 'activa';
    }
    
    const membresias = await db.membresiaCliente.findMany({
      where,
      orderBy: { fechaFin: 'desc' },
      include: {
        cliente: {
          include: {
            empleado: { select: { id: true, nombre: true } },
          },
        },
        membresia: true,
      },
    });
    
    return NextResponse.json(membresias);
  } catch (error) {
    console.error('Error fetching membresias cliente:', error);
    return NextResponse.json({ error: 'Error al obtener membresías' }, { status: 500 });
  }
}

// POST - Asignar membresía a cliente
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'membresias-cliente:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const data = await request.json();
    
    // Obtener el plan de membresía para calcular fecha fin
    const plan = await db.membresia.findUnique({
      where: { id: data.membresiaId },
    });
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan de membresía no encontrado' }, { status: 404 });
    }
    
    // Verificar si el cliente tiene una membresía activa
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const membresiaActiva = await db.membresiaCliente.findFirst({
      where: {
        clienteId: data.clienteId,
        estado: "activa",
        fechaFin: { gte: hoy },
      },
      orderBy: { fechaFin: 'desc' },
    });
    
    // Si tiene membresía activa, forzar fecha de inicio al día siguiente del término
    let fechaInicio: Date;
    if (membresiaActiva) {
      fechaInicio = new Date(membresiaActiva.fechaFin);
      fechaInicio.setDate(fechaInicio.getDate() + 1);
    } else {
      // Usar la fecha de inicio proporcionada o la fecha actual
      fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : new Date();
    }
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + plan.duracionDias);
    
    const membresiaCliente = await db.membresiaCliente.create({
      data: {
        clienteId: data.clienteId,
        membresiaId: data.membresiaId,
        fechaInicio,
        fechaFin,
        precioPagado: data.precioPagado ?? plan.precio,
        metodoPago: data.metodoPago,
        notas: data.notas,
      },
      include: {
        cliente: true,
        membresia: true,
      },
    });
    
    return NextResponse.json(membresiaCliente, { status: 201 });
  } catch (error) {
    console.error('Error creating membresia cliente:', error);
    return NextResponse.json({ error: 'Error al asignar membresía' }, { status: 500 });
  }
}
