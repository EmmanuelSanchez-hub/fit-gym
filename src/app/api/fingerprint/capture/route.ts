import { NextRequest, NextResponse } from 'next/server';

const FINGERPRINT_SERVICE_URL = process.env.FINGERPRINT_SERVICE_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const res = await fetch(`${FINGERPRINT_SERVICE_URL}/api/fingerprint/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Error al capturar huella' },
        { status: 503 }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error capturing fingerprint:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo capturar la huella' },
      { status: 503 }
    );
  }
}