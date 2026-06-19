import { NextRequest, NextResponse } from 'next/server';

const FINGERPRINT_SERVICE_URL = process.env.FINGERPRINT_SERVICE_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${FINGERPRINT_SERVICE_URL}/api/fingerprint/status`, {
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Servicio de huellas no disponible', status: res.status },
        { status: 503 }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching fingerprint status:', error);
    return NextResponse.json(
      { error: 'No se pudo conectar al servicio de huellas', connected: false },
      { status: 503 }
    );
  }
}