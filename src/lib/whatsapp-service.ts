/**
 * Módulo de WhatsApp integrado en Next.js
 *
 * Este módulo ejecuta la conexión de WhatsApp (Baileys)
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  WASocket,
} from '@whiskeysockets/baileys';
import type { WAConnectionState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface WhatsAppState {
  connected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  lastConnection: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkResult {
  success: number;
  failed: number;
  results: Array<{ phone: string; success: boolean; error?: string }>;
}

export interface BulkRecipient {
  phone: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
const SESSION_DIR = join(process.cwd(), 'data', 'whatsapp', 'session');
const STATE_FILE = join(
  process.cwd(),
  'data',
  'whatsapp',
  'state.json',
);

// Logger silencioso (cambiar a 'debug' para más logs)
const logger = pino({ level: 'silent' });

// ---------------------------------------------------------------------------
// Estado en memoria (global, singleton)
// ---------------------------------------------------------------------------
let sock: WASocket | null = null;
let qrCodeData: string | null = null;
let connectionState: WAConnectionState = 'close';
let lastConnectionTime: Date | null = null;

// ---------------------------------------------------------------------------
// Funciones auxiliares
// ---------------------------------------------------------------------------

function saveState() {
  const state: WhatsAppState = {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber:
      sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status:
      connectionState === 'open'
        ? 'connected'
        : connectionState === 'connecting'
          ? 'connecting'
          : qrCodeData
            ? 'qr_ready'
            : 'disconnected',
  };

  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch {
    // Si no se puede escribir (serverless), ignoramos
  }
}

export function getState(): WhatsAppState {
  return {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber:
      sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status:
      connectionState === 'open'
        ? 'connected'
        : connectionState === 'connecting'
          ? 'connecting'
          : qrCodeData
            ? 'qr_ready'
            : 'disconnected',
  };
}

// ---------------------------------------------------------------------------
// Conexión WhatsApp
// ---------------------------------------------------------------------------

/**
 * Inicia la conexión de WhatsApp.
 * @param forceNewQR - Si es true, elimina la sesión previa para forzar un QR nuevo.
 *                     Usar false (omitiendo) para reconexiones automáticas.
 */
export async function startWhatsApp(forceNewQR: boolean = true) {
  // Si ya hay conexión activa o QR listo, no crear duplicado
  if (sock) {
    if (connectionState === 'open') {
      console.log(' WhatsApp: Ya conectado');
      return sock;
    }
    if (connectionState === 'connecting' && qrCodeData && !forceNewQR) {
      console.log(' WhatsApp: QR ya listo');
      return sock;
    }
  }
  
  // Limpiar socket previo (pero NO la sesión guardada en disco)
  if (sock) {
    try {
      (sock.ev as any).removeAllListeners('connection.update');
      (sock.ev as any).removeAllListeners('creds.update');
      sock.end(undefined);
    } catch {
      // ignore
    }
    sock = null;
  }

  // Solo forzar QR nuevo si el usuario hizo clic en "Conectar"
  if (forceNewQR) {
    if (existsSync(SESSION_DIR)) {
      try {
        rmSync(SESSION_DIR, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    qrCodeData = null;
  }

  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }

  connectionState = 'connecting';
  saveState();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
  });

  // Connection update handler
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeData = await QRCode.toDataURL(qr);
      connectionState = 'connecting';
      saveState();
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      connectionState = 'close';
      qrCodeData = null;
      saveState();

      if (shouldReconnect) {
        // Reconexión automática: NO forzar QR nuevo, usar sesión guardada
        setTimeout(() => startWhatsApp(false), 5000);
      }
    } else if (connection === 'open') {
      connectionState = 'open';
      lastConnectionTime = new Date();
      qrCodeData = null;
      saveState();
    }
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  return sock;
}

/**
 * Desconexión insegura (solo limpia variables, no llama a logout)
 * Útil para resetear el estado sin depender del socket
 */
async function unsafeDisconnect() {
  if (sock) {
    try {
      (sock.ev as any).removeAllListeners('connection.update');
      (sock.ev as any).removeAllListeners('creds.update');
      sock.end(undefined);
    } catch {
      // ignore
    }
    sock = null;
  }
  connectionState = 'close';
  qrCodeData = null;
  saveState();
}

// ---------------------------------------------------------------------------
// Enviar mensajes
// ---------------------------------------------------------------------------

export async function sendMessage(
  to: string,
  message: string,
): Promise<SendResult> {
  if (!sock || connectionState !== 'open') {
    return { success: false, error: 'WhatsApp no está conectado' };
  }

  try {
    let formattedNumber = to.replace(/\D/g, '');
    if (!formattedNumber.startsWith('51')) {
      formattedNumber = '51' + formattedNumber;
    }

    const jid = `${formattedNumber}@s.whatsapp.net`;
    const sentMsg = await sock.sendMessage(jid, { text: message });

    return { success: true, messageId: sentMsg?.key?.id || `wa_${Date.now()}` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function sendBulkMessages(
  recipients: BulkRecipient[],
  messageTemplate: string,
): Promise<BulkResult> {
  const results: Array<{
    phone: string;
    success: boolean;
    error?: string;
  }> = [];
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const personalizedMessage = messageTemplate.replace(
      /{nombre}/g,
      recipient.name,
    );
    const result = await sendMessage(recipient.phone, personalizedMessage);

    results.push({
      phone: recipient.phone,
      success: result.success,
      error: result.error,
    });

    if (result.success) success++;
    else failed++;

    // Pequeña pausa entre mensajes para evitar rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { success, failed, results };
}

// ---------------------------------------------------------------------------
// Desconectar
// ---------------------------------------------------------------------------

export async function disconnectWhatsApp() {
  if (sock) {
    try {
      await sock.logout();
    } catch {
      // ignore
    }
    sock = null;
  }

  if (existsSync(SESSION_DIR)) {
    try {
      rmSync(SESSION_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  mkdirSync(SESSION_DIR, { recursive: true });

  connectionState = 'close';
  qrCodeData = null;
  lastConnectionTime = null;
  saveState();
}