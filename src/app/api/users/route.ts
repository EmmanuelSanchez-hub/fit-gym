import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar todos los usuarios
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'usuarios:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const users = await db.user.findMany({
      include: {
        empleado: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // No devolver contraseñas
    const safeUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      empleado: user.empleado,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST - Crear nuevo usuario (con opción de crear empleado simultáneamente)
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'usuarios:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { email, password, rol, empleadoId, activo, crearEmpleado, empleadoData } = await request.json();

    if (!email || !password || !rol) {
      return NextResponse.json(
        { error: 'Email, contraseña y rol son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Si se solicita crear empleado simultáneamente
    let empleadoCreado = null;
    let finalEmpleadoId = empleadoId || null;

    if (crearEmpleado && empleadoData) {
      // Verificar si el email del empleado ya existe
      const existingEmpleado = await db.empleado.findUnique({
        where: { email: empleadoData.email || email },
      });

      if (existingEmpleado) {
        return NextResponse.json(
          { error: 'Ya existe un empleado con este email' },
          { status: 400 }
        );
      }

      // Determinar el cargo basado en el rol
      let cargo = 'Recepcionista';
      if (rol === 'SUPER_USUARIO') cargo = 'Super Usuario';
      else if (rol === 'ADMINISTRADOR') cargo = 'Administrador';
      else if (rol === 'ENTRENADOR') cargo = 'Entrenador';

      // Crear el empleado
      empleadoCreado = await db.empleado.create({
        data: {
          nombre: empleadoData.nombre || email.split('@')[0],
          email: empleadoData.email || email,
          telefono: empleadoData.telefono || null,
          cargo: empleadoData.cargo || cargo,
        },
      });

      finalEmpleadoId = empleadoCreado.id;
    }

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        rol,
        empleadoId: finalEmpleadoId,
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
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
