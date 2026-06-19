import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getState } from '@/lib/whatsapp-service';

// GET - Get WhatsApp connection status
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'whatsapp:connect');
  if ('error' in authResult) return authResult.error;
  
  try {
    const state = getState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    return NextResponse.json({
      connected: false,
      qrCode: null,
      phoneNumber: null,
      lastConnection: null,
      status: 'service_unavailable',
      error: 'WhatsApp service error'
    }, { status: 503 });
  }
}
