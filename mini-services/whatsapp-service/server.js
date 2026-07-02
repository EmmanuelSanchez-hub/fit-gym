/**
 * WhatsApp Microservicio para Railway/Fly.io
 * Ejecuta Baileys en un proceso persistente y expone endpoints HTTP.
 */

const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const QRCode = require('qrcode');
const { writeFileSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');

// ── Config ──
const PORT = process.env.PORT || 3004;
const DATA_DIR = '/data';
const SESSION_DIR = join(DATA_DIR, 'session');
const STATE_FILE = join(DATA_DIR, 'state.json');
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(SESSION_DIR, { recursive: true });

const logger = pino({ level: 'warn' });
const app = express();
app.use(express.json());

// ── Estado global ──
let sock = null;
let qrCodeData = null;
let qrTimestamp = 0;
let connectionState = 'close';
let lastConnectionTime = null;
let lastError = null;
let reconnectAttempts = 0;
let lastQrRaw = null;
const MAX_RECONNECT_ATTEMPTS = 5;
const QR_EXPIRY_MS = 90_000;

// ── Helpers ──
function isQRValid() { return qrTimestamp > 0 && (Date.now() - qrTimestamp) < QR_EXPIRY_MS; }

function computeStatus() {
  if (lastError) return 'error';
  if (connectionState === 'open') return 'connected';
  if (qrCodeData && isQRValid()) return 'qr_ready';
  if (connectionState === 'connecting') return 'connecting';
  return 'disconnected';
}

function saveState() {
  try {
    writeFileSync(STATE_FILE, JSON.stringify({
      connected: connectionState === 'open',
      qrCode: qrCodeData,
      phoneNumber: sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
      lastConnection: lastConnectionTime?.toISOString() || null,
      status: computeStatus(),
      error: lastError || undefined,
    }, null, 2));
  } catch { /* ok */ }
}

function getState() {
  return {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber: sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null,
    lastConnection: lastConnectionTime?.toISOString() || null,
    status: computeStatus(),
    error: lastError || undefined,
  };
}

function cleanupSocket() {
  if (!sock) return;
  try { sock.ev.removeAllListeners('connection.update'); } catch { /* ok */ }
  try { sock.ev.removeAllListeners('creds.update'); } catch { /* ok */ }
  try { sock.end?.(); } catch { /* ok */ }
  try { (sock.ws)?.close?.(); } catch { /* ok */ }
  sock = null;
}

// ── WhatsApp Connection ──
async function startWhatsApp(forceNewQR = true) {
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
    console.log('[WhatsApp Service] Sesión:', SESSION_DIR);

    const { version } = await fetchLatestBaileysVersion();
    console.log('[WhatsApp Service] Baileys v' + version.join('.'));

    sock = makeWASocket({
      version,
      logger,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: true,
      mobile: false,
      connectTimeoutMs: 60_000,
    });

    console.log('[WhatsApp Service] Socket creado');

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      if (qr) {
        if (qr === lastQrRaw) return;
        lastQrRaw = qr;
        console.log('[WhatsApp Service] QR recibido');
        try { qrCodeData = await QRCode.toDataURL(qr); } catch { qrCodeData = qr; }
        qrTimestamp = Date.now();
        lastError = null;
        reconnectAttempts = 0;
        saveState();
        return;
      }

      if (connection === 'open') {
        console.log('[WhatsApp Service] ✅ Conectado');
        connectionState = 'open';
        lastConnectionTime = new Date();
        qrCodeData = null;
        lastError = null;
        saveState();
        return;
      }

      if (connection === 'close') {
        connectionState = 'close';
        qrCodeData = null;
        qrTimestamp = 0;

        if (isLoggedOut) { lastError = 'Sesión cerrada desde el teléfono.'; cleanupSocket(); saveState(); return; }

        if (statusCode === 503 || statusCode === 428) {
          lastError = 'Sesión no válida. Desvincula el dispositivo en tu teléfono.';
          cleanupSocket();
          try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
          saveState();
          return;
        }

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          lastError = null;
          setTimeout(() => startWhatsApp(false), 3000 * reconnectAttempts);
          saveState();
          return;
        }

        lastError = 'No se pudo mantener la conexión.';
        cleanupSocket();
        saveState();
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[WhatsApp Service] Error:', msg);
    lastError = msg;
    connectionState = 'close';
    saveState();
    throw err;
  }
  return sock;
}

// ── Rutas ──
app.get('/status', (req, res) => res.json(getState()));

app.post('/connect', async (req, res) => {
  const state = getState();
  if (state.connected) return res.json({ message: 'Already connected', status: 'connected' });
  startWhatsApp(true).catch(err => console.error('[WhatsApp Service] Error:', err));
  res.json({ message: 'Connection initiated', status: 'connecting' });
});

app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  if (!sock || connectionState !== 'open') return res.status(400).json({ success: false, error: 'WhatsApp no está conectado' });
  try {
    let number = to.replace(/\D/g, '');
    if (!number.startsWith('51')) number = '51' + number;
    const result = await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
    res.json({ success: true, messageId: result?.key?.id || `wa_${Date.now()}` });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/disconnect', async (req, res) => {
  if (sock) { try { await sock.logout(); } catch { /* ok */ } cleanupSocket(); }
  try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
  mkdirSync(SESSION_DIR, { recursive: true });
  connectionState = 'close'; qrCodeData = null; lastError = null; reconnectAttempts = 0;
  saveState();
  res.json({ message: 'Disconnected', status: 'disconnected' });
});

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.listen(PORT, () => {
  console.log(`[WhatsApp Service] Escuchando en puerto ${PORT}`);
  startWhatsApp(false).catch(() => {});
});