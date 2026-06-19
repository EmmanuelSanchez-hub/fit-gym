import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar todas las promociones
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const promociones = await db.promocion.findMany({
      include: {
        _count: {
          select: { envios: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(promociones);
  } catch (error) {
    console.error('Error fetching promociones:', error);
    return NextResponse.json({ error: 'Error al obtener promociones' }, { status: 500 });
  }
}

// POST - Crear nueva promoción
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { titulo, tipo, descuento, validoDesde, validoHasta, plantillaWhatsApp } = await request.json();

    if (!titulo || !tipo || !descuento) {
      return NextResponse.json(
        { error: 'Título, tipo y descuento son requeridos' },
        { status: 400 }
      );
    }

    const promocion = await db.promocion.create({
      data: {
        titulo,
        tipo,
        descuento: parseFloat(descuento),
        validoDesde: new Date(validoDesde || new Date()),
        validoHasta: new Date(validoHasta || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        plantillaWhatsApp: plantillaWhatsApp || null,
      },
    });

    return NextResponse.json(promocion);
  } catch (error) {
    console.error('Error creating promocion:', error);
    return NextResponse.json({ error: 'Error al crear promoción' }, { status: 500 });
  }
}
