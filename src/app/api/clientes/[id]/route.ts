import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cliente = await db.cliente.findUnique({
      where: { id },
      include: {
        empleado: true,
        membresias: {
          include: { membresia: true },
          orderBy: { fechaFin: 'desc' },
        },
        reservas: {
          include: { clase: true },
          orderBy: { fecha: 'desc' },
          take: 10,
        },
        accesos: {
          orderBy: { fechaHora: 'desc' },
          take: 20,
        },
        promocionesRecibidas: {
          include: { promocion: true },
          orderBy: { fechaEnvio: 'desc' },
          take: 10,
        },
        _count: {
          select: { accesos: true, reservas: true, membresias: true },
        },
      },
    });
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error fetching cliente:', error);
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const cliente = await db.cliente.update({
      where: { id },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        direccion: data.direccion,
        foto: data.foto,
        huellaBiometrica: data.huellaBiometrica,
        activo: data.activo,
      },
    });
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error updating cliente:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.cliente.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cliente:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
