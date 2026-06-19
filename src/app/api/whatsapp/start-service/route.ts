import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { startWhatsApp } from '@/lib/whatsapp-service';

// POST - Start WhatsApp connection (ya no es necesario iniciar un servicio externo)
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'whatsapp:connect');
  if ('error' in authResult) return authResult.error;
  
  try {
    await startWhatsApp();
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp iniciado correctamente'
    });
    
  } catch (error) {
    console.error('Error starting WhatsApp:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start WhatsApp'
    }, { status: 500 });
  }
}
