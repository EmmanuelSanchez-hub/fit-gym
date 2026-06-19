import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener empleado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empleado = await db.empleado.findUnique({
      where: { id },
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
    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }
    return NextResponse.json(empleado);
  } catch (error) {
    console.error('Error fetching empleado:', error);
    return NextResponse.json({ error: 'Error al obtener empleado' }, { status: 500 });
  }
}

// PUT - Actualizar empleado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const empleado = await db.empleado.update({
      where: { id },
      data: {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        cargo: data.cargo,
        foto: data.foto,
        activo: data.activo,
      },
    });
    return NextResponse.json(empleado);
  } catch (error) {
    console.error('Error updating empleado:', error);
    return NextResponse.json({ error: 'Error al actualizar empleado' }, { status: 500 });
  }
}

// DELETE - Eliminar empleado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.empleado.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting empleado:', error);
    return NextResponse.json({ error: 'Error al eliminar empleado' }, { status: 500 });
  }
}
