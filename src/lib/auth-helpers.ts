import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Tipos de roles (debe coincidir con el enum de Prisma)
export type Rol = 'SUPER_USUARIO' | 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ENTRENADOR';

// Interface para el usuario autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: Rol;
  empleadoId?: string | null;
  nombre?: string;
}

// Permisos por rol - SUPER_USUARIO tiene TODOS los permisos
const PERMISSIONS: Record<Rol, string[]> = {
  SUPER_USUARIO: [
    // Acceso total - todos los permisos posibles
    '*',
    // Dashboard
    'dashboard:read', 'dashboard:write',
    // Clientes
    'clientes:read', 'clientes:create', 'clientes:update', 'clientes:delete',
    // Empleados
    'empleados:read', 'empleados:create', 'empleados:update', 'empleados:delete',
    // Membresías
    'membresias:read', 'membresias:create', 'membresias:update', 'membresias:delete',
    // Membresías de clientes (asignar)
    'membresias-cliente:read', 'membresias-cliente:create',
    // Reservas
    'reservas:read', 'reservas:create', 'reservas:update', 'reservas:delete',
    // Accesos
    'accesos:read', 'accesos:create', 'accesos:delete',
    // Promociones
    'promociones:read', 'promociones:create', 'promociones:update', 'promociones:delete',
    // Usuarios
    'usuarios:read', 'usuarios:create', 'usuarios:update', 'usuarios:delete',
    // Configuración
    'configuracion:read', 'configuracion:update',
    // WhatsApp
    'whatsapp:connect', 'whatsapp:send', 'whatsapp:disconnect',
    // Seed
    'seed:read', 'seed:create', 'seed:delete',
    // Export/Import
    'export:read', 'import:write',
    // Clases
    'clases:read', 'clases:create', 'clases:update', 'clases:delete',
  ],
  ADMINISTRADOR: [
    'dashboard:read',
    'clientes:read', 'clientes:create', 'clientes:update', 'clientes:delete',
    'empleados:read', 'empleados:create', 'empleados:update',
    'membresias:read', 'membresias:create', 'membresias:update', 'membresias:delete',
    'membresias-cliente:read', 'membresias-cliente:create',
    'reservas:read', 'reservas:create', 'reservas:update', 'reservas:delete',
    'accesos:read', 'accesos:create',
    'promociones:read', 'promociones:create', 'promociones:update', 'promociones:delete',
    'usuarios:read', 'usuarios:update',
    'configuracion:read', 'configuracion:update',
    'whatsapp:connect', 'whatsapp:send', 'whatsapp:disconnect',
    'clases:read', 'clases:create', 'clases:update', 'clases:delete',
    'export:read', 'import:write',
  ],
  RECEPCIONISTA: [
    'dashboard:read',
    'clientes:read', 'clientes:create', 'clientes:update',
    'empleados:read',
    'membresias:read', // Solo puede ver planes, no crear/editar/eliminar planes
    'membresias-cliente:read', 'membresias-cliente:create', // Puede asignar membresías a clientes
    'reservas:read', 'reservas:create', 'reservas:update',
    'accesos:read', 'accesos:create',
    'promociones:read', // Solo puede ver promociones y enviarlas
    'whatsapp:connect', 'whatsapp:send', 'whatsapp:disconnect',
    'clases:read',
  ],
  ENTRENADOR: [
    'dashboard:read',
    'reservas:read', 'reservas:create', 'reservas:update',
    'accesos:read', 'accesos:create',
    'clientes:read',
    'empleados:read',
    'clases:read',
    'whatsapp:disconnect',
  ],
};

// Verificar si un usuario tiene un permiso específico
export function hasPermission(rol: Rol, permission: string): boolean {
  const permissions = PERMISSIONS[rol] || [];
  // SUPER_USUARIO tiene acceso total con el permiso '*'
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

// Obtener usuario desde la sesión (usando cookies)
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Obtener el token de sesión desde las cookies
    // NOTA: El login usa cookie 'session', no 'session_token'
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    // Decodificar el token para obtener el user ID
    const decoded = Buffer.from(sessionToken, 'base64').toString();
    const [userId] = decoded.split(':');
    
    if (!userId) {
      return null;
    }
    
    // Verificar la sesión en la tabla configuracion (como lo hace el login)
    const sessionData = await db.configuracion.findUnique({
      where: { clave: `session_${userId}` },
    });
    
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData.valor);
    if (session.token !== sessionToken) {
      return null;
    }
    
    // Obtener datos del usuario
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        empleado: {
          select: { id: true, nombre: true }
        }
      }
    });
    
    // Verificar si el usuario existe y está activo
    if (!user || !user.activo) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      rol: user.rol as Rol,
      empleadoId: user.empleadoId,
      nombre: user.empleado?.nombre || undefined,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// Función helper para verificar autenticación en APIs
export async function requireAuth(
  request: NextRequest, 
  requiredPermission?: string
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'No autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    };
  }
  
  if (requiredPermission && !hasPermission(user.rol, requiredPermission)) {
    return {
      error: NextResponse.json(
        { error: 'No tiene permisos para realizar esta acción', code: 'FORBIDDEN' },
        { status: 403 }
      )
    };
  }
  
  return { user };
}

// Helper para respuestas de error estandarizadas
export function unauthorizedResponse(message = 'No autenticado') {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

export function forbiddenResponse(message = 'No tiene permisos para realizar esta acción') {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}
