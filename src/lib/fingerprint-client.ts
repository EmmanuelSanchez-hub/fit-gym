/**
 * Cliente para comunicacion con el Fingerprint Service.
 *
 * ESTRATEGIA HIBRIDA:
 * 1. PRIMERO intenta a traves del proxy de Next.js (/api/fingerprint/*)
 *    - En LOCAL: funciona porque Next.js corre en la misma maquina que el fingerprint service
 *    - En VERCEL: falla (el servidor de Vercel no puede alcanzar localhost de la PC del usuario)
 * 2. Si falla, intenta DIRECTO a http://localhost:3005 desde el navegador
 *    - En LOCAL: funciona (ambos HTTP, sin Mixed Content)
 *    - En VERCEL: el navegador BLOQUEA por Mixed Content (HTTPS -> HTTP)
 * 3. Si ambos fallan, devuelve un estado de desconexion con mensaje explicativo
 *
 * NOTA: El servicio de huellas SOLO funciona en la red local del gimnasio.
 * En Vercel, la aplicacion muestra el resto de funcionalidades (clientes, membresias, etc.)
 * pero el lector biometrico requiere ejecucion local.
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

/**
 * Determina si la pagina actual se sirve sobre HTTPS
 */
function isPageHttps(): boolean {
  if (typeof window !== "undefined") {
    return window.location.protocol === "https:";
  }
  return false;
}

/**
 * Determina si estamos en un entorno local (desarrollo o produccion local)
 */
function isLocalEnvironment(): boolean {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.");
  }
  return false;
}

/**
 * Obtiene la URL base para las peticiones.
 * Sigue la estrategia hibrida:
 * - Si es entorno local: usa el proxy de Next.js (funciona en desarrollo)
 * - Si es HTTPS (Vercel): usa el proxy de Next.js (fallara, pero capturamos el error)
 * - Si es HTTP pero no local: usa directo a localhost (para compatibilidad)
 */
function getBaseUrl(): string {
  // En entorno local, usar proxy de Next.js
  if (isLocalEnvironment()) {
    return ""; // Ruta relativa -> /api/fingerprint/*
  }
  
  // Si la pagina esta en HTTPS (Vercel, produccion), intentar proxy
  if (isPageHttps()) {
    return ""; // Ruta relativa -> /api/fingerprint/*
  }
  
  // Fallback: directo al fingerprint service
  return FINGERPRINT_BASE_URL;
}

/**
 * Intenta una peticion primero via proxy de Next.js y si falla via directa
 */
async function fetchWithFallback(path: string, options: RequestInit = {}): Promise<Response> {
  const proxyUrl = `/api/fingerprint${path}`;
  const directUrl = `${FINGERPRINT_BASE_URL}/api/fingerprint${path}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // Primer intento: via proxy de Next.js
    const proxyRes = await fetch(proxyUrl, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        ...(options.headers as Record<string, string>),
      },
    });

    clearTimeout(timeoutId);
    
    if (proxyRes.ok) {
      return proxyRes;
    }
    
    // El proxy respondio pero con error
    // Si estamos en local, el proxy deberia funcionar, asi que devolvemos el error
    if (isLocalEnvironment()) {
      return proxyRes;
    }
    
  } catch {
    clearTimeout(timeoutId);
    // Proxy fallo (probablemente Mixed Content o servidor no disponible)
  }

  // Segundo intento: directo al fingerprint service (desde el navegador)
  // Esto funciona en HTTP (local) pero sera bloqueado en HTTPS (Vercel)
  try {
    const directController = new AbortController();
    const directTimeoutId = setTimeout(() => directController.abort(), 5000);
    
    const directRes = await fetch(directUrl, {
      ...options,
      signal: directController.signal,
      cache: "no-store",
      mode: "cors",
      headers: {
        ...(options.headers as Record<string, string>),
      },
    });

    clearTimeout(directTimeoutId);
    return directRes;
  } catch {
    // Directo tambien fallo (Mixed Content en HTTPS)
    // Devolver una respuesta de error simulada
    return new Response(
      JSON.stringify({
        connected: false,
        error: isPageHttps()
          ? "El lector biometrico requiere conexion local. Abre la app en http://localhost:3000 o instala el certificado SSL local."
          : "Servicio de huellas no disponible. Verifica que el Fingerprint Service este ejecutandose en http://localhost:3005",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function checkFingerprintStatus(): Promise<DeviceStatus> {
  const res = await fetchWithFallback("/status");
  if (!res.ok) {
    return {
      connected: false,
      deviceName: "No disponible",
      port: null,
      firmwareVersion: null,
      sensorReady: false,
      lastError: "Servicio de huellas no disponible",
      mode: "offline",
    };
  }
  return res.json();
}

export async function connectFingerprintDevice(): Promise<{ success: boolean; error?: string }> {
  const res = await fetchWithFallback("/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || "Error al conectar con el servicio de huellas" };
  }
  return res.json();
}

export async function captureFingerprint(): Promise<CaptureResult> {
  const res = await fetchWithFallback("/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return {
      success: false,
      error: "Error al capturar huella. Verifica que el lector este conectado.",
    };
  }
  return res.json();
}

export async function disconnectFingerprintDevice(): Promise<{ success: boolean; error?: string }> {
  const res = await fetchWithFallback("/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return { success: false, error: "Error al desconectar el servicio de huellas" };
  }
  return res.json();
}

export async function searchFingerprint(template: string): Promise<SearchResult> {
  const res = await fetchWithFallback("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template }),
  });
  if (!res.ok) {
    return { found: false, message: "Error al buscar huella en el servicio local" };
  }
  return res.json();
}
