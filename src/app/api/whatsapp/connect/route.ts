import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { startWhatsApp, getState } from '@/lib/whatsapp-service';

// POST - Start WhatsApp connection
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'whatsapp:connect');
  if ('error' in authResult) return authResult.error;
  
  try {
    await startWhatsApp();
    return NextResponse.json({
      message: 'Connection initiated',
      status: 'connecting'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error connecting to WhatsApp:', msg);
    return NextResponse.json({
      success: false,
      error: msg,
      status: 'error'
    }, { status: 500 });
  }
}
