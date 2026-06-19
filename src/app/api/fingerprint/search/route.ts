import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { template } = await request.json();
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template de huella requerido' },
        { status: 400 }
      );
    }

    // Importar Prisma
    const { db } = await import('@/lib/db');
    
    // Buscar cliente por huella biométrica
    const cliente = await db.cliente.findFirst({
      where: {
        huellaBiometrica: template,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
        telefono: true,
        huellaBiometrica: true,
      },
    });

    if (cliente) {
      return NextResponse.json({
        found: true,
        cliente,
      });
    } else {
      return NextResponse.json({
        found: false,
        message: 'Huella no registrada',
      });
    }
  } catch (error) {
    console.error('Error searching fingerprint:', error);
    return NextResponse.json(
      { error: 'Error al buscar huella' },
      { status: 500 }
    );
  }
}