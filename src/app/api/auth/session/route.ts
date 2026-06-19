import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    
    // Decode token to get user ID
    const decoded = Buffer.from(sessionToken, 'base64').toString();
    const [userId] = decoded.split(':');
    
    if (!userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    
    // Verify session in database
    const sessionData = await db.configuracion.findUnique({
      where: { clave: `session_${userId}` },
    });
    
    if (!sessionData) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    
    const session = JSON.parse(sessionData.valor);
    if (session.token !== sessionToken) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    
    // Get user data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { empleado: true },
    });
    
    if (!user || !user.activo) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.empleado?.nombre || user.email,
        rol: user.rol,
        empleadoId: user.empleadoId,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
