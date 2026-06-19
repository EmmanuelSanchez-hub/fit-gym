import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar todos los empleados
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'empleados:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const empleados = await db.empleado.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clientesRegistrados: true,
            accesosRegistrados: true,
            reservasCreadas: true,
            promocionesEnviadas: true,
          },
        },
      },
    });
    return NextResponse.json(empleados);
  } catch (error) {
    console.error('Error fetching empleados:', error);
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 });
  }
}

// POST - Crear nuevo empleado
export async function POST(request: NextRequest) {
  // Verificar autenticación - solo ADMIN y SUPER pueden crear empleados
  const authResult = await requireAuth(request, 'empleados:create');
  if ('error' in authResult) return authResult.error;
  
  try {
    const data = await request.json();
    const empleado = await db.empleado.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        cargo: data.cargo,
        foto: data.foto,
        activo: data.activo ?? true,
      },
    });
    return NextResponse.json(empleado, { status: 201 });
  } catch (error) {
    console.error('Error creating empleado:', error);
    return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 });
  }
}
