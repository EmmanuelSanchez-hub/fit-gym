import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - Verificar si existe un super usuario
export async function GET() {
  try {
    const superUser = await db.user.findFirst({
      where: { rol: 'SUPER_USUARIO' },
    });

    return NextResponse.json({
      hasSuperUser: !!superUser,
    });
  } catch (error) {
    console.error('Error checking super user:', error);
    return NextResponse.json({ error: 'Error al verificar super usuario' }, { status: 500 });
  }
}

// POST - Crear super usuario inicial
export async function POST() {
  try {
    // Verificar si ya existe un super usuario
    const existingSuperUser = await db.user.findFirst({
      where: { rol: 'SUPER_USUARIO' },
    });

    if (existingSuperUser) {
      return NextResponse.json(
        { error: 'Ya existe un Super Usuario' },
        { status: 400 }
      );
    }

    // Crear empleado para el super usuario
    const empleado = await db.empleado.create({
      data: {
        nombre: 'Super Usuario',
        email: 'super@gym.com',
        telefono: '000-0000',
        cargo: 'Super Administrador',
      },
    });

    // Hash de la contraseña por defecto
    const hashedPassword = await bcrypt.hash('super123', 10);

    // Crear super usuario
    const user = await db.user.create({
      data: {
        email: 'super@gym.com',
        password: hashedPassword,
        rol: 'SUPER_USUARIO',
        empleadoId: empleado.id,
        activo: true,
      },
      include: {
        empleado: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Super Usuario creado exitosamente',
      credentials: {
        email: 'super@gym.com',
        password: 'super123',
      },
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.empleado?.nombre,
      },
    });
  } catch (error) {
    console.error('Error creating super user:', error);
    return NextResponse.json({ error: 'Error al crear super usuario' }, { status: 500 });
  }
}
