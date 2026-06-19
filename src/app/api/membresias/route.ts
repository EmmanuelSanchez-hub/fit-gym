import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar todas las membresías
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'membresias:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const membresias = await db.membresia.findMany({
      where: { activo: true },
      include: {
        _count: {
          select: { clientesMembresia: true },
        },
      },
      orderBy: { precio: 'asc' },
    });

    return NextResponse.json(membresias);
  } catch (error) {
    console.error('Error fetching membresias:', error);
    return NextResponse.json({ error: 'Error al obtener membresías' }, { status: 500 });
  }
}

// POST - Crear nueva membresía
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'membresias:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { nombre, descripcion, precio, duracionDias, beneficios } = await request.json();

    if (!nombre || !precio || !duracionDias) {
      return NextResponse.json(
        { error: 'Nombre, precio y duración son requeridos' },
        { status: 400 }
      );
    }

    const membresia = await db.membresia.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        duracionDias: parseInt(duracionDias),
        beneficios: beneficios ? JSON.stringify(beneficios) : null,
      },
    });

    return NextResponse.json(membresia);
  } catch (error) {
    console.error('Error creating membresia:', error);
    return NextResponse.json({ error: 'Error al crear membresía' }, { status: 500 });
  }
}
