"use client";

/**
 * Hook para comunicarse con la Windows App del lector de huellas
 * que corre en la PC local del cliente en http://localhost:3005
 */

export interface DeviceStatus {
  connected: boolean;
  deviceName: string;
  port: string | null;
  firmwareVersion: string | null;
  sensorReady: boolean;
  lastError: string | null;
  mode: string;
}

export interface CaptureResult {
  success: boolean;
  template: string | null;
  quality: number;
  error?: string;
}

export function useFingerprintService() {
  const getStatus = async (): Promise<DeviceStatus> => {
    const res = await fetch('/api/fingerprint/status');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Servicio de huellas no disponible");
    }
    return res.json();
  };

  const connect = async (): Promise<boolean> => {
    const res = await fetch('/api/fingerprint/connect', {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al conectar el lector");
    }
    const data = await res.json();
    return data.success;
  };

  const captureFingerprint = async (): Promise<CaptureResult> => {
    const res = await fetch('/api/fingerprint/capture', {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al capturar huella");
    }
    return res.json();
  };

  return {
    getStatus,
    connect,
    captureFingerprint,
    serviceUrl: '/api/fingerprint',
  };
}
