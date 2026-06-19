import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Cambiar contraseña de usuario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 });
  }
}
