import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }
    
    const user = await db.user.findUnique({
      where: { email },
      include: { empleado: true },
    });
    
    if (!user || !user.activo) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }
    
    // Create session token (simple approach)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    // Set cookie process.env.NODE_ENV === 'production'
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    // Store session in database
    await db.configuracion.upsert({
      where: { clave: `session_${user.id}` },
      create: {
        clave: `session_${user.id}`,
        valor: JSON.stringify({
          token: sessionToken,
          createdAt: new Date().toISOString(),
        }),
      },
      update: {
        valor: JSON.stringify({
          token: sessionToken,
          createdAt: new Date().toISOString(),
        }),
      },
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.empleado?.nombre || user.email,
        rol: user.rol,
        empleadoId: user.empleadoId,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok'
  });
}
