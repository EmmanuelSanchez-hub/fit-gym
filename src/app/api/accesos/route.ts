import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar accesos
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'accesos:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const fecha = searchParams.get('fecha');
    const limite = parseInt(searchParams.get('limite') || '50');
    
    const where: Record<string, unknown> = {};
    if (clienteId) where.clienteId = clienteId;
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      where.fechaHora = { gte: fechaInicio, lte: fechaFin };
    }
    
    const accesos = await db.acceso.findMany({
      where,
      orderBy: { fechaHora: 'desc' },
      take: limite,
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, foto: true, codigoAcceso: true },
        },
        empleado: { select: { id: true, nombre: true } },
      },
    });
    
    return NextResponse.json(accesos);
  } catch (error) {
    console.error('Error fetching accesos:', error);
    return NextResponse.json({ error: 'Error al obtener accesos' }, { status: 500 });
  }
}

// POST - Registrar acceso (simulación biométrica)
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'accesos:create');
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  
  try {
    const data = await request.json();
    
    // Buscar cliente por código o huella biométrica
    let cliente = null;
    if (data.codigoAcceso) {
      cliente = await db.cliente.findUnique({
        where: { codigoAcceso: data.codigoAcceso },
        include: {
          membresias: {
            where: { estado: 'activa' },
            orderBy: { fechaFin: 'desc' },
            take: 1,
            include: { membresia: true },
          },
        },
      });
    } else if (data.huellaBiometrica) {
      cliente = await db.cliente.findFirst({
        where: { huellaBiometrica: data.huellaBiometrica },
        include: {
          membresias: {
            where: { estado: 'activa' },
            orderBy: { fechaFin: 'desc' },
            take: 1,
            include: { membresia: true },
          },
        },
      });
    }
    
    if (!cliente) {
      // Registrar acceso fallido
      await db.acceso.create({
        data: {
          clienteId: data.clienteId || 'unknown',
          empleadoId: user.empleadoId || data.empleadoId,
          tipo: data.tipo || 'entrada',
          metodo: data.metodo || 'manual',
          exitoso: false,
          notas: 'Cliente no encontrado',
        },
      });
      return NextResponse.json({ 
        exitoso: false,
        mensaje: 'Cliente no encontrado',
      }, { status: 200 });
    }
    
    // Verificar membresía activa
    const membresiaCliente = cliente.membresias[0];
    const hoy = new Date();
    
    if (!membresiaCliente) {
      await db.acceso.create({
        data: {
          clienteId: cliente.id,
          empleadoId: user.empleadoId || data.empleadoId,
          tipo: data.tipo || 'entrada',
          metodo: data.metodo || 'biometrico',
          exitoso: false,
          notas: 'Sin membresía',
        },
      });
      return NextResponse.json({ 
        exitoso: false,
        cliente: { 
          id: cliente.id, 
          nombre: cliente.nombre, 
          apellido: cliente.apellido,
          foto: cliente.foto,
        },
        mensaje: 'El cliente no tiene membresía registrada',
      });
    }
    
    const fechaFin = new Date(membresiaCliente.fechaFin);
    const fechaInicio = new Date(membresiaCliente.fechaInicio);
    const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    const expirada = diasRestantes < 0;
    
    if (expirada) {
      await db.acceso.create({
        data: {
          clienteId: cliente.id,
          empleadoId: user.empleadoId || data.empleadoId,
          tipo: data.tipo || 'entrada',
          metodo: data.metodo || 'biometrico',
          exitoso: false,
          notas: 'Membresía vencida',
        },
      });
      return NextResponse.json({ 
        exitoso: false,
        cliente: { 
          id: cliente.id, 
          nombre: cliente.nombre, 
          apellido: cliente.apellido,
          foto: cliente.foto,
        },
        membresia: {
          id: membresiaCliente.id,
          nombre: membresiaCliente.membresia.nombre,
          fechaInicio: membresiaCliente.fechaInicio,
          fechaFin: membresiaCliente.fechaFin,
          diasRestantes,
          expirada,
        },
        mensaje: 'Membresía expirada',
      });
    }
    
    // Registrar acceso exitoso
    const acceso = await db.acceso.create({
      data: {
        clienteId: cliente.id,
        empleadoId: user.empleadoId || data.empleadoId,
        tipo: data.tipo || 'entrada',
        metodo: data.metodo || 'biometrico',
        exitoso: true,
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, foto: true, codigoAcceso: true },
        },
      },
    });
    
    return NextResponse.json({
      exitoso: true,
      cliente: { 
        id: cliente.id, 
        nombre: cliente.nombre, 
        apellido: cliente.apellido,
        foto: cliente.foto,
      },
      membresia: {
        id: membresiaCliente.id,
        nombre: membresiaCliente.membresia.nombre,
        fechaInicio: membresiaCliente.fechaInicio,
        fechaFin: membresiaCliente.fechaFin,
        diasRestantes,
        expirada,
      },
      acceso,
    });
  } catch (error) {
    console.error('Error creating acceso:', error);
    return NextResponse.json({ error: 'Error al registrar acceso' }, { status: 500 });
  }
}
