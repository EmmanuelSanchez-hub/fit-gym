import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener clase por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const clase = await db.clase.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservas: true },
        },
      },
    });

    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    return NextResponse.json(clase);
  } catch (error) {
    console.error('Error fetching clase:', error);
    return NextResponse.json({ error: 'Error al obtener clase' }, { status: 500 });
  }
}

// PUT - Actualizar clase
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nombre, descripcion, capacidad, duracion, instructor, diaSemana, horaInicio, horaFin, activo } = await request.json();

    const clase = await db.clase.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || null,
        capacidad: parseInt(capacidad),
        duracion: parseInt(duracion),
        instructor: instructor || null,
        diaSemana: diaSemana || null,
        horaInicio: horaInicio || null,
        horaFin: horaFin || null,
        activo: activo !== undefined ? activo : true,
      },
    });

    return NextResponse.json(clase);
  } catch (error) {
    console.error('Error updating clase:', error);
    return NextResponse.json({ error: 'Error al actualizar clase' }, { status: 500 });
  }
}

// DELETE - Eliminar (desactivar) clase y cancelar sus reservas activas
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Cancelar todas las reservas confirmadas de esta clase (hoy en adelante)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const reservasCanceladas = await db.reserva.updateMany({
      where: {
        claseId: id,
        estado: 'confirmada',
        fecha: { gte: hoy },
      },
      data: { estado: 'cancelada' },
    });

    // Soft delete de la clase
    const clase = await db.clase.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Clase desactivada',
      reservasCanceladas: reservasCanceladas.count,
    });
  } catch (error) {
    console.error('Error deleting clase:', error);
    return NextResponse.json({ error: 'Error al eliminar clase' }, { status: 500 });
  }
}
