import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar todas las clases
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'clases:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const clases = await db.clase.findMany({
      where: { activo: true },
      include: {
        _count: {
          select: { reservas: true },
        },
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });

    return NextResponse.json(clases);
  } catch (error) {
    console.error('Error fetching clases:', error);
    return NextResponse.json({ error: 'Error al obtener clases' }, { status: 500 });
  }
}

// POST - Crear nueva clase
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'clases:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { nombre, descripcion, capacidad, duracion, instructor, diaSemana, horaInicio, horaFin } = await request.json();

    if (!nombre || !capacidad || !duracion) {
      return NextResponse.json(
        { error: 'Nombre, capacidad y duración son requeridos' },
        { status: 400 }
      );
    }

    const clase = await db.clase.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        capacidad: parseInt(capacidad),
        duracion: parseInt(duracion),
        instructor: instructor || null,
        diaSemana: diaSemana || null,
        horaInicio: horaInicio || null,
        horaFin: horaFin || null,
      },
    });

    return NextResponse.json(clase);
  } catch (error) {
    console.error('Error creating clase:', error);
    return NextResponse.json({ error: 'Error al crear clase' }, { status: 500 });
  }
}
