/**
 * Módulo de WhatsApp integrado en Next.js (Baileys v7.0.0-rc13)
 * 
 * Conexión Multi-Device con generación de QR para vinculación.
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  WASocket,
} from '@whiskeysockets/baileys';
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
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'error';
  error?: string;
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
// En Vercel/serverless, solo /tmp tiene escritura. En local, usar data/
const DATA_DIR = process.env.VERCEL ? '/tmp' : join(process.cwd(), 'data', 'whatsapp');
const SESSION_DIR = join(DATA_DIR, 'session');
const STATE_FILE = join(DATA_DIR, 'state.json');

// Logger mínimo
const logger = pino({ level: 'warn' });

// ---------------------------------------------------------------------------
// Estado global
// ---------------------------------------------------------------------------
let sock: WASocket | null = null;
let qrCodeData: string | null = null;
let connectionState: string = 'close';
let lastConnectionTime: Date | null = null;
let lastError: string | null = null;
let qrTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let isManuallyDisconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function saveState() {
  const state: WhatsAppState = {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber: sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status: lastError
      ? 'error'
      : connectionState === 'open'
        ? 'connected'
        : connectionState === 'connecting'
          ? 'connecting'
          : qrCodeData
            ? 'qr_ready'
            : 'disconnected',
    error: lastError || undefined,
  };
  try { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch { /* ok */ }
}

export function getState(): WhatsAppState {
  return {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber: sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status: lastError
      ? 'error'
      : connectionState === 'open'
        ? 'connected'
        : connectionState === 'connecting'
          ? 'connecting'
          : qrCodeData
            ? 'qr_ready'
            : 'disconnected',
    error: lastError || undefined,
  };
}

function clearQRTimeout() {
  if (qrTimeout) { clearTimeout(qrTimeout); qrTimeout = null; }
}

// ---------------------------------------------------------------------------
// Conexión principal
// ---------------------------------------------------------------------------

export async function startWhatsApp(forceNewQR: boolean = true) {
  if (sock && connectionState === 'open') {
    console.log('[WhatsApp] Ya conectado');
    return sock;
  }

  // Limpiar socket anterior
  if (sock) {
    try {
      (sock.ev as any).removeAllListeners('connection.update');
      (sock.ev as any).removeAllListeners('creds.update');
      sock.end?.(undefined);
    } catch { /* ok */ }
    sock = null;
  }

  // Resetear para nueva conexión manual
  if (forceNewQR) {
    reconnectAttempts = 0;
    isManuallyDisconnecting = false;
    try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
    qrCodeData = null;
  }

  mkdirSync(SESSION_DIR, { recursive: true });

  connectionState = 'connecting';
  lastError = null;
  clearQRTimeout();
  saveState();

  // Timeout de seguridad: 60s para recibir QR
  qrTimeout = setTimeout(() => {
    if (connectionState === 'connecting' && !qrCodeData) {
      lastError = 'No se recibió código QR en 60s. Verifica tu conexión a internet.';
      console.error('[WhatsApp] QR timeout');
      saveState();
    }
  }, 60000);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    console.log('[WhatsApp] Sesión:', SESSION_DIR);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp] Baileys v${version.join('.')} (latest: ${isLatest})`);

    // Crear socket con opciones para v7
    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      qrTimeout: 60_000,
    });

    console.log('[WhatsApp] Socket creado, esperando eventos...');

    // Manejar eventos de conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log('[WhatsApp] Evento:', JSON.stringify({
        connection,
        hasQR: !!qr,
        isNewLogin: update.isNewLogin,
        errCode: lastDisconnect?.error
          ? (lastDisconnect.error as any)?.output?.statusCode || (lastDisconnect.error as any)?.message
          : null,
      }));

      // QR recibido
      if (qr) {
        console.log('[WhatsApp] QR recibido, generando imagen...');
        try {
          qrCodeData = await QRCode.toDataURL(qr);
          console.log('[WhatsApp] QR generado OK');
        } catch (e) {
          console.error('[WhatsApp] Error al convertir QR:', e);
        }
        lastError = null;
        clearQRTimeout();
        connectionState = 'connecting';
        saveState();
        return;
      }

      // Conectado
      if (connection === 'open') {
        console.log('[WhatsApp] Conectado exitosamente');
        connectionState = 'open';
        lastConnectionTime = new Date();
        qrCodeData = null;
        lastError = null;
        reconnectAttempts = 0;
        clearQRTimeout();
        saveState();
        return;
      }

      // Desconectado
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        console.log(`[WhatsApp] Desconectado (${statusCode}, loggedOut: ${isLoggedOut})`);

        if (lastDisconnect?.error) {
          lastError = `Error: ${(lastDisconnect.error as any)?.message || 'desconexión'}`;
        }

        connectionState = 'close';
        qrCodeData = null;
        clearQRTimeout();
        saveState();

        if (isManuallyDisconnecting || isLoggedOut) {
          isManuallyDisconnecting = false;
          if (isLoggedOut) lastError = 'Sesión cerrada. Vuelve a escanear el QR.';
          saveState();
          return;
        }

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(5000 * reconnectAttempts, 15000);
          console.log(`[WhatsApp] Reintento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} en ${delay / 1000}s`);
          setTimeout(() => startWhatsApp(false), delay);
        } else {
          lastError = `No se pudo conectar tras ${MAX_RECONNECT_ATTEMPTS} intentos.`;
          console.error('[WhatsApp] Máximo de reintentos alcanzado');
          saveState();
        }
        return;
      }
    });

    // Guardar credenciales
    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[WhatsApp] Error al iniciar:', msg);
    lastError = `Error: ${msg}`;
    connectionState = 'close';
    qrCodeData = null;
    clearQRTimeout();
    saveState();
    throw err;
  }

  return sock;
}

// ---------------------------------------------------------------------------
// Desconectar
// ---------------------------------------------------------------------------

export async function disconnectWhatsApp() {
  isManuallyDisconnecting = true;
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS;

  if (sock) {
    try { await sock.logout(); } catch { /* ok */ }
    try { sock.end?.(undefined); } catch { /* ok */ }
    sock = null;
  }

  try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
  mkdirSync(SESSION_DIR, { recursive: true });

  connectionState = 'close';
  qrCodeData = null;
  lastConnectionTime = null;
  lastError = null;
  clearQRTimeout();
  saveState();
}

// ---------------------------------------------------------------------------
// Enviar mensajes
// ---------------------------------------------------------------------------

export async function sendMessage(to: string, message: string): Promise<SendResult> {
  if (!sock || connectionState !== 'open') {
    return { success: false, error: 'WhatsApp no está conectado' };
  }

  try {
    let number = to.replace(/\D/g, '');
    if (!number.startsWith('51')) number = '51' + number;

    const jid = `${number}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: message });

    return { success: true, messageId: result?.key?.id || `wa_${Date.now()}` };
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
  const results: Array<{ phone: string; success: boolean; error?: string }> = [];
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const msg = messageTemplate.replace(/{nombre}/g, recipient.name);
    const result = await sendMessage(recipient.phone, msg);

    results.push({ phone: recipient.phone, success: result.success, error: result.error });
    if (result.success) success++;
    else failed++;

    await new Promise((r) => setTimeout(r, 1500));
  }

  return { success, failed, results };
}