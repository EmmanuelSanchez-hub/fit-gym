import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { startWhatsApp, getState } from '@/lib/whatsapp-service';

// POST - Start WhatsApp connection (fire-and-forget)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, 'whatsapp:connect');
  if ('error' in authResult) return authResult.error;
  
  const state = await getState();
  if (state.connected) {
    return NextResponse.json({ message: 'Already connected', status: 'connected' });
  }
  
  // Siempre generar QR nuevo en conexión manual
  startWhatsApp(true).catch(err => {
    console.error('[WhatsApp API] Error:', err);
  });
  
  return NextResponse.json({ message: 'Connection initiated', status: 'connecting' });
}