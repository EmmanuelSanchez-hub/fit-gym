import { NextRequest, NextResponse } from 'next/server';

const FINGERPRINT_SERVICE_URL = process.env.FINGERPRINT_SERVICE_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const res = await fetch(`${FINGERPRINT_SERVICE_URL}/api/fingerprint/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Error al desconectar el servicio de huellas' },
        { status: 503 }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error disconnecting fingerprint service:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo desconectar el servicio de huellas' },
      { status: 503 }
    );
  }
}