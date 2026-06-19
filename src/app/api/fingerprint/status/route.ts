import { NextRequest, NextResponse } from 'next/server';

const FINGERPRINT_SERVICE_URL = process.env.FINGERPRINT_SERVICE_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  // Verificar si la solicitud viene desde el mismo origen (proxy local)
  // o si es externa (Vercel intentando alcanzar un servicio local)
  const isInternalRequest = request.headers.get('host')?.includes('localhost') || 
                             request.headers.get('host')?.includes('127.0.0.1');
  
  try {
    // En Vercel, este proxy NO puede alcanzar localhost:3005 de la PC del usuario
    // Solo funcionara si el servicio corre en el mismo servidor
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`${FINGERPRINT_SERVICE_URL}/api/fingerprint/status`, {
      next: { revalidate: 0 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!res.ok) {
      return NextResponse.json(
        { 
          connected: false, 
          sensorReady: false,
          deviceName: 'No disponible',
          port: null,
          firmwareVersion: null,
          lastError: 'Servicio de huellas no disponible',
          mode: 'offline',
          error: 'Servicio de huellas no disponible',
          status: res.status 
        },
        { status: 503 }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching fingerprint status:', error);
    // Devolver respuesta consistente con la interfaz DeviceStatus
    return NextResponse.json(
      { 
        connected: false, 
        sensorReady: false,
        deviceName: 'No disponible',
        port: null,
        firmwareVersion: null,
        lastError: isInternalRequest 
          ? 'No se pudo conectar al servicio de huellas local'
          : 'El lector biometrico solo esta disponible en la red local del gimnasio',
        mode: 'offline',
        error: 'No se pudo conectar al servicio de huellas'
      },
      { status: 503 }
    );
  }
}
