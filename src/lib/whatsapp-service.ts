/**
 * Módulo de WhatsApp integrado en Next.js (Baileys v7)
 * Configuración basada en la documentación oficial:
 * https://baileys.wiki/docs/socket/configuration
 * https://baileys.wiki/docs/socket/connecting
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
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import QRCode from 'qrcode';

// ── Tipos ──
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

// ── Configuración ──
const DATA_DIR = join(process.cwd(), 'data', 'whatsapp');
const SESSION_DIR = join(DATA_DIR, 'session');
const STATE_FILE = join(DATA_DIR, 'state.json');
const logger = pino({ level: 'warn' });

// ── Estado global ──
let sock: WASocket | null = null;
let qrCodeData: string | null = null;
let qrTimestamp: number = 0;
let connectionState: string = 'close';
let lastConnectionTime: Date | null = null;
let lastError: string | null = null;
let reconnectAttempts = 0;
let lastQrRaw: string | null = null;
const MAX_RECONNECT_ATTEMPTS = 3;
const QR_EXPIRY_MS = 90_000;

// ── Helpers ──
function isQRValid(): boolean {
  return qrTimestamp > 0 && (Date.now() - qrTimestamp) < QR_EXPIRY_MS;
}

function saveState() {
  const state: WhatsAppState = {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber: sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status: lastError
      ? 'error' : connectionState === 'open'
        ? 'connected' : (qrCodeData && isQRValid())
          ? 'qr_ready' : connectionState === 'connecting'
            ? 'connecting' : 'disconnected',
    error: lastError || undefined,
  };
  try { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch { /* ok */ }
}

export function getState(): WhatsAppState {
  const status = lastError
    ? 'error' : connectionState === 'open'
      ? 'connected' : (qrCodeData && isQRValid())
        ? 'qr_ready' : connectionState === 'connecting'
          ? 'connecting' : 'disconnected';

  return {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber: sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status,
    error: lastError || undefined,
  };
}

function cleanupSocket() {
  if (!sock) return;
  try { sock.ev.removeAllListeners('connection.update'); } catch { /* ok */ }
  try { sock.ev.removeAllListeners('creds.update'); } catch { /* ok */ }
  try { sock.end?.(undefined); } catch { /* ok */ }
  try { (sock.ws as any)?.close?.(); } catch { /* ok */ }
  sock = null;
}

// ── Conexión ──

export async function startWhatsApp(forceNewQR: boolean = true) {
  if (sock && connectionState === 'open' && !forceNewQR) return sock;

  cleanupSocket();
  connectionState = 'connecting';
  lastError = null;
  qrCodeData = null;
  qrTimestamp = 0;
  reconnectAttempts = 0;

  if (forceNewQR) {
    try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
  }
  mkdirSync(SESSION_DIR, { recursive: true });
  saveState();

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    console.log('[WhatsApp] Sesión:', SESSION_DIR);

    const { version } = await fetchLatestBaileysVersion();
    console.log('[WhatsApp] Baileys v' + version.join('.'));

    // Configuración según la documentación oficial de Baileys v7
    sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: true,
      mobile: false,
      connectTimeoutMs: 60_000,
    });

    console.log('[WhatsApp] Socket creado');

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log('[WhatsApp]', JSON.stringify({ connection, hasQR: !!qr, statusCode, isLoggedOut }));

      // QR recibido
      if (qr) {
        if (qr === lastQrRaw) return;
        lastQrRaw = qr;
        console.log('[WhatsApp] QR recibido');
        try {
          qrCodeData = await QRCode.toDataURL(qr);
        } catch {
          qrCodeData = qr;
        }
        qrTimestamp = Date.now();
        lastError = null;
        connectionState = 'connecting';
        reconnectAttempts = 0;
        saveState();
        return;
      }

      // Conectado
      if (connection === 'open') {
        console.log('[WhatsApp] ✅ Conectado');
        connectionState = 'open';
        lastConnectionTime = new Date();
        qrCodeData = null;
        qrTimestamp = 0;
        lastError = null;
        reconnectAttempts = 0;
        saveState();
        return;
      }

      // Desconectado
      if (connection === 'close') {
        connectionState = 'close';

        // Si hay QR recién generado (menos de 5s), no borrarlo — el 428 es esperado
        // cuando el teléfono ya tiene vinculado el dispositivo. El usuario debe desvincular
        // primero y luego escanear. Mantenemos el QR visible para que lo intente.
        const qrRecienGenerado = qrTimestamp > 0 && (Date.now() - qrTimestamp) < 5000;

        if (!qrRecienGenerado) {
          qrCodeData = null;
          qrTimestamp = 0;
        }

        if (isLoggedOut) {
          qrCodeData = null;
          qrTimestamp = 0;
          lastError = 'Sesión cerrada desde el teléfono. Vuelve a conectar.';
          cleanupSocket();
          saveState();
          return;
        }

        if (statusCode === 503 || statusCode === 428) {
          if (!qrRecienGenerado) {
            lastError = 'Sesión no válida. Desvincula el dispositivo en tu teléfono y vuelve a conectar.';
            cleanupSocket();
            try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
          }
          // Si el QR es reciente, mantenerlo visible (el usuario puede desvincular y escanear)
          saveState();
          return;
        }

        // Reconexión automática solo si no hay QR reciente
        const qrRecienGenerado2 = qrTimestamp > 0 && (Date.now() - qrTimestamp) < 5000;
        if (!qrRecienGenerado2 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`[WhatsApp] Reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
          lastError = null;
          setTimeout(() => startWhatsApp(false), 3000 * reconnectAttempts);
          saveState();
          return;
        }

        lastError = 'No se pudo mantener la conexión. Reconecta manualmente.';
        cleanupSocket();
        saveState();
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[WhatsApp] Error:', msg);
    lastError = msg;
    connectionState = 'close';
    saveState();
    throw err;
  }

  return sock;
}

// ── Desconectar ──
export async function disconnectWhatsApp() {
  if (sock) {
    try { await sock.logout(); } catch { /* ok */ }
    cleanupSocket();
  }
  try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
  mkdirSync(SESSION_DIR, { recursive: true });
  connectionState = 'close';
  qrCodeData = null;
  qrTimestamp = 0;
  lastError = null;
  lastConnectionTime = null;
  reconnectAttempts = 0;
  saveState();
}

// ── Enviar ──
export async function sendMessage(to: string, message: string): Promise<SendResult> {
  if (!sock || connectionState !== 'open') {
    return { success: false, error: 'WhatsApp no está conectado' };
  }
  try {
    let number = to.replace(/\D/g, '');
    if (!number.startsWith('51')) number = '51' + number;
    const result = await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
    return { success: true, messageId: result?.key?.id || `wa_${Date.now()}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}