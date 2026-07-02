/**
 * Cliente HTTP para el microservicio de WhatsApp (Fly.io)
 * 
 * En desarrollo local (localhost:3004), el microservicio usa Baileys directamente.
 * En producción (Vercel), las llamadas van a dominio privado
 */

export interface WhatsAppState {
  connected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  lastConnection: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'error';
  error?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// URL del microservicio WhatsApp
const SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3004';

export async function getState(): Promise<WhatsAppState> {
  try {
    const res = await fetch(`${SERVICE_URL}/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Service unavailable');
    return await res.json();
  } catch {
    return {
      connected: false,
      qrCode: null,
      phoneNumber: null,
      lastConnection: null,
      status: 'disconnected',
      error: 'Servicio WhatsApp no disponible',
    };
  }
}

export async function startWhatsApp(forceNewQR: boolean = true): Promise<void> {
  const body = JSON.stringify({ forceNewQR });
  console.log('[WhatsApp Proxy] Conectando a:', `${SERVICE_URL}/connect`);
  const res = await fetch(`${SERVICE_URL}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('[WhatsApp Proxy] Error:', res.status, errText);
    throw new Error(`Failed to start WhatsApp: ${res.status} ${errText}`);
  }
}

export async function disconnectWhatsApp(): Promise<void> {
  await fetch(`${SERVICE_URL}/disconnect`, { method: 'DELETE' });
}

export async function sendMessage(to: string, message: string): Promise<SendResult> {
  try {
    const res = await fetch(`${SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}