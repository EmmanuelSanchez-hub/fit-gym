import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// ============================================
// LIMPIEZA DE BASE DE DATOS
// ============================================

// Orden de eliminación basado en dependencias de foreign keys
const TABLAS_EN_ORDEN = [
  // Tablas con foreign keys a otras tablas (eliminar primero)
  { nombre: 'Session', delete: () => db.session.deleteMany() },
  { nombre: 'Account', delete: () => db.account.deleteMany() },
  { nombre: 'PromocionEnviada', delete: () => db.promocionEnviada.deleteMany() },
  { nombre: 'Acceso', delete: () => db.acceso.deleteMany() },
  { nombre: 'Reserva', delete: () => db.reserva.deleteMany() },
  { nombre: 'MembresiaCliente', delete: () => db.membresiaCliente.deleteMany() },
  
  // Tablas principales (sin dependencias circulares)
  { nombre: 'Cliente', delete: () => db.cliente.deleteMany() },
  { nombre: 'Promocion', delete: () => db.promocion.deleteMany() },
  { nombre: 'Clase', delete: () => db.clase.deleteMany() },
  { nombre: 'Membresia', delete: () => db.membresia.deleteMany() },
  
  // Tablas de usuarios (opcional - usar con cuidado)
  { nombre: 'User', delete: () => db.user.deleteMany() },
  { nombre: 'Empleado', delete: () => db.empleado.deleteMany() },
  
  // Tablas de configuración y tokens
  { nombre: 'VerificationToken', delete: () => db.verificationToken.deleteMany() },
  { nombre: 'Configuracion', delete: () => db.configuracion.deleteMany() },
];

interface ClearResult {
  tabla: string;
  eliminados: number;
}

// POST - Limpiar toda la base de datos (o solo datos de demostración)
export async function POST(request: NextRequest) {
  // Verificar autenticación - solo SUPER_USUARIO puede limpiar la BD
  const authResult = await requireAuth(request, 'seed:delete');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const keepUsers = searchParams.get('keepUsers') === 'true';
    
    const resultados: ClearResult[] = [];
    
    // Determinar qué tablas limpiar
    const tablasALimpiar = keepUsers 
      ? TABLAS_EN_ORDEN.filter(t => !['User', 'Empleado'].includes(t.nombre))
      : TABLAS_EN_ORDEN;
    
    // Eliminar en orden
    for (const tabla of tablasALimpiar) {
      const result = await tabla.delete();
      resultados.push({
        tabla: tabla.nombre,
        eliminados: result.count,
      });
    }

    return NextResponse.json({
      success: true,
      message: keepUsers 
        ? 'Datos de demostración eliminados (usuarios conservados)'
        : 'Base de datos limpiada completamente',
      detalles: resultados,
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { 
        error: 'Error al limpiar la base de datos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
