import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await db.user.findUnique({
      where: { id },
      include: {
        empleado: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      empleado: user.empleado,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, rol, empleadoId, activo } = await request.json();

    const user = await db.user.update({
      where: { id },
      data: {
        email,
        rol,
        empleadoId: empleadoId || null,
        activo: activo !== undefined ? activo : true,
      },
      include: {
        empleado: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      empleado: user.empleado,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // No permitir eliminar el último super usuario
    const user = await db.user.findUnique({
      where: { id },
    });

    if (user?.rol === 'SUPER_USUARIO') {
      const superUsersCount = await db.user.count({
        where: { rol: 'SUPER_USUARIO' },
      });

      if (superUsersCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar el último Super Usuario' },
          { status: 400 }
        );
      }
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
