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
 * Verifica si la pagina actual esta en HTTPS (Vercel)
 */
function isHttps(): boolean {
  if (typeof window !== "undefined") {
    return window.location.protocol === "https:";
  }
  return false;
}

/**
 * Intenta hacer fetch al fingerprint service local.
 * En HTTPS (Vercel) el navegador bloqueara la peticion por Mixed Content.
 */
async function fetchFingerprint(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${FINGERPRINT_BASE_URL}/api/fingerprint${path}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: "cors",
      headers: {
        ...(options.headers as Record<string, string>),
      },
    });
    clearTimeout(timeoutId);
    return res;
  } catch {
    clearTimeout(timeoutId);
    // En HTTPS, esto fallara por Mixed Content
    // En HTTP, fallara si el servicio no esta corriendo
    throw new Error(
      isHttps()
        ? "Servicio de huellas no disponible desde HTTPS. Usa la app en http://localhost:3000"
        : "No se pudo conectar al servicio de huellas en http://localhost:3005"
    );
  }
}

export async function checkFingerprintStatus(): Promise<DeviceStatus> {
  try {
    const res = await fetchFingerprint("/status");
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
  } catch {
    return {
      connected: false,
      deviceName: "No disponible",
      port: null,
      firmwareVersion: null,
      sensorReady: false,
      lastError: isHttps()
        ? "HTTPS bloquea conexion a localhost. Abre http://localhost:3000"
        : "Servicio no disponible en http://localhost:3005",
      mode: "offline",
    };
  }
}

export async function connectFingerprintDevice(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchFingerprint("/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || "Error al conectar" };
    }
    return res.json();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error de conexion" };
  }
}

export async function captureFingerprint(): Promise<CaptureResult> {
  try {
    const res = await fetchFingerprint("/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return { success: false, error: "Error al capturar huella" };
    }
    return res.json();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error de conexion" };
  }
}

export async function disconnectFingerprintDevice(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchFingerprint("/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return { success: false, error: "Error al desconectar" };
    }
    return res.json();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error de conexion" };
  }
}

export async function searchFingerprint(template: string): Promise<SearchResult> {
  try {
    const res = await fetchFingerprint("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    });
    if (!res.ok) {
      return { found: false, message: "Error al buscar huella" };
    }
    return res.json();
  } catch (e) {
    return { found: false, message: e instanceof Error ? e.message : "Error de conexion" };
  }
}