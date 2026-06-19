import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Obtener promoción por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { id } = await params;
    
    const promocion = await db.promocion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { envios: true },
        },
      },
    });

    if (!promocion) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    return NextResponse.json(promocion);
  } catch (error) {
    console.error('Error fetching promocion:', error);
    return NextResponse.json({ error: 'Error al obtener promoción' }, { status: 500 });
  }
}

// PUT - Actualizar promoción
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:update');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { id } = await params;
    const { titulo, tipo, descuento, validoDesde, validoHasta, plantillaWhatsApp, activo } = await request.json();

    const promocion = await db.promocion.update({
      where: { id },
      data: {
        titulo,
        tipo,
        descuento: parseFloat(descuento),
        validoDesde: new Date(validoDesde),
        validoHasta: new Date(validoHasta),
        plantillaWhatsApp: plantillaWhatsApp || null,
        activo: activo !== undefined ? activo : true,
      },
    });

    return NextResponse.json(promocion);
  } catch (error) {
    console.error('Error updating promocion:', error);
    return NextResponse.json({ error: 'Error al actualizar promoción' }, { status: 500 });
  }
}

// DELETE - Eliminar promoción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:delete');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { id } = await params;

    await db.promocion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Promoción eliminada' });
  } catch (error) {
    console.error('Error deleting promocion:', error);
    return NextResponse.json({ error: 'Error al eliminar promoción' }, { status: 500 });
  }
}
