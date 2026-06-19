import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar todos los clientes
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'clientes:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true';
    
    const clientes = await db.cliente.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { createdAt: 'desc' },
      include: {
        empleado: {
          select: { id: true, nombre: true, cargo: true },
        },
        membresias: {
          include: { membresia: true },
          orderBy: { fechaFin: 'desc' },
          take: 1,
        },
        _count: {
          select: { accesos: true, reservas: true },
        },
      },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'clientes:create');
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  
  try {
    const data = await request.json();
    // Generar código de acceso único
    const codigoAcceso = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Verificar si el DNI ya existe (si se proporciona)
    if (data.dni) {
      const existingDni = await db.cliente.findUnique({
        where: { dni: data.dni },
      });
      if (existingDni) {
        return NextResponse.json({ error: 'Ya existe un cliente con este DNI' }, { status: 400 });
      }
    }
    
    const cliente = await db.cliente.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni || null,
        email: data.email,
        telefono: data.telefono,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        direccion: data.direccion,
        foto: data.foto,
        huellaBiometrica: data.huellaBiometrica,
        codigoAcceso,
        registradoPor: user.empleadoId || data.registradoPor,
      },
      include: {
        empleado: true,
      },
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
