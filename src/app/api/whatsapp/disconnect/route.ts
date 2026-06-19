import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { disconnectWhatsApp } from '@/lib/whatsapp-service';

// DELETE - Disconnect WhatsApp
export async function DELETE(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'whatsapp:disconnect');
  if ('error' in authResult) return authResult.error;
  
  try {
    await disconnectWhatsApp();
    return NextResponse.json({
      message: 'Disconnected',
      status: 'disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to disconnect WhatsApp'
    }, { status: 500 });
  }
}
