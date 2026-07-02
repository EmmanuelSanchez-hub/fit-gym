/**
 * WhatsApp Microservicio para Railway
 * - HTTP: conectarse, desconectarse y enviar mensajes
 * - WebSocket: actualizaciones de estado en tiempo real
 */
const http = require('http');
const { WebSocketServer } = require('ws');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const { mkdirSync, rmSync } = require('fs');
const { join } = require('path');

// Config
const PORT = process.env.PORT || 3004;
const DATA_DIR = '/data';
const SESSION_DIR = join(DATA_DIR, 'session');
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(SESSION_DIR, { recursive: true });

const logger = pino({ level: 'warn' });

// Estado global
let sock = null;
let qrCodeData = null;
let connectionState = 'close';
let lastError = null;
let phoneNumber = null;
let reconnectAttempts = 0;
let lastQrRaw = null;
const MAX_RECONNECT_ATTEMPTS = 5;
const QR_EXPIRY_MS = 90_000;

// Lista de clientes WebSocket conectados
const wsClients = new Set();

function getState() {
  return {
    connected: connectionState === 'open',
    qrCode: qrCodeData,
    phoneNumber,
    lastConnection: null,
    status: computeStatus(),
    error: lastError || undefined,
  };
}

function computeStatus() {
  if (lastError) return 'error';
  if (connectionState === 'open') return 'connected';
  if (qrCodeData) return 'qr_ready';
  if (connectionState === 'connecting') return 'connecting';
  return 'disconnected';
}

/** Envía el estado actual a todos los clientes WebSocket */
function broadcastState() {
  const state = getState();
  const msg = JSON.stringify({ event: 'state', data: state });
  for (const ws of wsClients) {
    try { ws.send(msg); } catch { /* ignore broken pipe */ }
  }
}

function cleanupSocket() {
  if (!sock) return;
  try { sock.ev.removeAllListeners('connection.update'); } catch { /* ok */ }
  try { sock.ev.removeAllListeners('creds.update'); } catch { /* ok */ }
  try { sock.end?.(); } catch { /* ok */ }
  try { (sock.ws)?.close?.(); } catch { /* ok */ }
  sock = null;
}

async function startWhatsApp(forceNewQR = true) {
  if (sock && connectionState === 'open' && !forceNewQR) return sock;

  cleanupSocket();
  connectionState = 'connecting';
  lastError = null;
  qrCodeData = null;
  reconnectAttempts = 0;
  broadcastState();

  if (forceNewQR) {
    try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
  }
  mkdirSync(SESSION_DIR, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    console.log('[WhatsApp] Sesión:', SESSION_DIR);

    const { version } = await fetchLatestBaileysVersion();

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

    console.log('[WhatsApp] Socket creado');

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      if (qr) {
        if (qr === lastQrRaw) return;
        lastQrRaw = qr;
        console.log('[WhatsApp] QR recibido');
        try { qrCodeData = await QRCode.toDataURL(qr); } catch { qrCodeData = qr; }
        lastError = null;
        reconnectAttempts = 0;
        broadcastState();
        return;
      }

      if (connection === 'open') {
        console.log('[WhatsApp] ✅ Conectado');
        connectionState = 'open';
        phoneNumber = sock?.user?.id?.split(':')[0]?.replace('@s.whatsapp.net', '') || null;
        qrCodeData = null;
        lastError = null;
        broadcastState();
        return;
      }

      if (connection === 'close') {
        connectionState = 'close';
        qrCodeData = null;
        phoneNumber = null;

        if (isLoggedOut) {
          lastError = 'Sesión cerrada desde el teléfono.';
          cleanupSocket();
          broadcastState();
          return;
        }

        if (statusCode === 503 || statusCode === 428) {
          lastError = 'Sesión no válida. Desvincula el dispositivo en tu teléfono.';
          cleanupSocket();
          try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
          broadcastState();
          return;
        }

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          lastError = null;
          setTimeout(() => startWhatsApp(false), 3000 * reconnectAttempts);
          broadcastState();
          return;
        }

        lastError = 'No se pudo mantener la conexión.';
        cleanupSocket();
        broadcastState();
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error('[WhatsApp] Error:', err.message);
    lastError = err.message;
    connectionState = 'close';
    broadcastState();
    throw err;
  }
  return sock;
}

// ── Servidor HTTP + WebSocket ──

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const sendJSON = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Rutas HTTP (status, connect, send, disconnect)
  if (path === '/status' && req.method === 'GET') return sendJSON(getState());
  if (path === '/health' && req.method === 'GET') return sendJSON({ status: 'ok', uptime: process.uptime() });

  if (path === '/connect' && req.method === 'POST') {
    const state = getState();
    if (state.connected) return sendJSON({ message: 'Already connected', status: 'connected' });
    startWhatsApp(true).catch(err => console.error('[WhatsApp] Error:', err));
    return sendJSON({ message: 'Connection initiated', status: 'connecting' });
  }

  if (path === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { to, message } = JSON.parse(body);
        if (!sock || connectionState !== 'open') return sendJSON({ success: false, error: 'WhatsApp no está conectado' }, 400);
        let number = to.replace(/\D/g, '');
        if (!number.startsWith('51')) number = '51' + number;
        const result = await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        sendJSON({ success: true, messageId: result?.key?.id || `wa_${Date.now()}` });
      } catch (e) { sendJSON({ success: false, error: e.message }, 500); }
    });
    return;
  }

  if (path === '/disconnect' && req.method === 'DELETE') {
    if (sock) { try { await sock.logout(); } catch { /* ok */ } cleanupSocket(); }
    try { rmSync(SESSION_DIR, { recursive: true, force: true }); } catch { /* ok */ }
    mkdirSync(SESSION_DIR, { recursive: true });
    connectionState = 'close'; qrCodeData = null; lastError = null; phoneNumber = null; reconnectAttempts = 0;
    broadcastState();
    return sendJSON({ message: 'Disconnected', status: 'disconnected' });
  }

  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  console.log('[WebSocket] Cliente conectado');
  wsClients.add(ws);
  // Enviar estado actual al conectarse
  try { ws.send(JSON.stringify({ event: 'state', data: getState() })); } catch { /* ok */ }

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log('[WebSocket] Cliente desconectado');
  });

  // Manejar comandos del frontend (opcional: conectar, desconectar)
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.command === 'connect') {
        await startWhatsApp(true).catch(err => console.error('[WhatsApp] Error:', err));
      } else if (msg.command === 'disconnect') {
        if (sock) { try { await sock.logout(); } catch { /* ok */ } cleanupSocket(); }
        connectionState = 'close'; qrCodeData = null; lastError = null; phoneNumber = null;
        broadcastState();
      }
    } catch { /* ignore malformed messages */ }
  });
});

server.listen(PORT, () => {
  console.log(`[WhatsApp] Servidor HTTP + WebSocket en puerto ${PORT}`);
  startWhatsApp(false).catch(() => {});
});