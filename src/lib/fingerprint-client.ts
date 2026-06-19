/**
 * Cliente para comunicación directa con el Fingerprint Service local.
 * 
 * IMPORTANTE: A diferencia de las API routes de Next.js que se ejecutan en Vercel,
 * este cliente hace fetch directamente desde el NAVEGADOR a localhost,
 * permitiendo que la web en Vercel se comunique con el lector de huellas
 * conectado a la PC del usuario.
 * 
 * ¿Cómo funciona?
 * - El navegador ejecuta JavaScript en la PC del usuario
 * - fetch("http://localhost:3005/...") va a la PC del usuario (NO a Vercel)
 * - Esto permite que la web alojada en Vercel controle un dispositivo USB local
 */

const FINGERPRINT_BASE_URL = "http://localhost:3005";

export interface DeviceStatus {
  connected: boolean;
  deviceName: string;
  port: string | null;
  firmwareVersion: string | null;
  sensorReady: boolean;
  lastError: string | null;
  mode: string;
  [key: string]: unknown;
}

export interface CaptureResult {
  success: boolean;
  template?: string;
  quality?: number;
  error?: string;
  [key: string]: unknown;
}

export interface SearchResult {
  found: boolean;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string | null;
    email: string | null;
    telefono: string | null;
    huellaBiometrica: string | null;
  };
  message?: string;
  [key: string]: unknown;
}

function getBaseUrl(): string {
  // Siempre usar localhost directamente desde el navegador
  // Esto funciona porque el fingerprint service corre en la PC local del usuario
  return FINGERPRINT_BASE_URL;
}

export async function checkFingerprintStatus(): Promise<DeviceStatus> {
  const res = await fetch(`${getBaseUrl()}/api/fingerprint/status`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Servicio de huellas no disponible");
  }
  return res.json();
}

export async function connectFingerprintDevice(): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${getBaseUrl()}/api/fingerprint/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Error al conectar con el servicio de huellas");
  }
  return res.json();
}

export async function captureFingerprint(): Promise<CaptureResult> {
  const res = await fetch(`${getBaseUrl()}/api/fingerprint/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Error al capturar huella");
  }
  return res.json();
}

export async function disconnectFingerprintDevice(): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${getBaseUrl()}/api/fingerprint/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Error al desconectar el servicio de huellas");
  }
  return res.json();
}

export async function searchFingerprint(template: string): Promise<SearchResult> {
  const res = await fetch(`${getBaseUrl()}/api/fingerprint/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template }),
  });
  if (!res.ok) {
    throw new Error("Error al buscar huella");
  }
  return res.json();
}