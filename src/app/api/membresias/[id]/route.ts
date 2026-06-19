import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener membresía por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const membresia = await db.membresia.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clientesMembresia: true },
        },
      },
    });

    if (!membresia) {
      return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
    }

    return NextResponse.json(membresia);
  } catch (error) {
    console.error('Error fetching membresia:', error);
    return NextResponse.json({ error: 'Error al obtener membresía' }, { status: 500 });
  }
}

// PUT - Actualizar membresía
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nombre, descripcion, precio, duracionDias, beneficios, activo } = await request.json();

    const membresia = await db.membresia.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        duracionDias: parseInt(duracionDias),
        beneficios: beneficios ? JSON.stringify(beneficios) : null,
        activo: activo !== undefined ? activo : true,
      },
    });

    return NextResponse.json(membresia);
  } catch (error) {
    console.error('Error updating membresia:', error);
    return NextResponse.json({ error: 'Error al actualizar membresía' }, { status: 500 });
  }
}

// DELETE - Eliminar (desactivar) membresía
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - marcar como inactiva
    const membresia = await db.membresia.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true, message: 'Membresía desactivada' });
  } catch (error) {
    console.error('Error deleting membresia:', error);
    return NextResponse.json({ error: 'Error al eliminar membresía' }, { status: 500 });
  }
}
