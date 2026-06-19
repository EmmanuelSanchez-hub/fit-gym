import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Listar promociones enviadas
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:read');
  if ('error' in authResult) return authResult.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const promocionId = searchParams.get('promocionId');
    const clienteId = searchParams.get('clienteId');
    
    const where: Record<string, unknown> = {};
    if (promocionId) where.promocionId = promocionId;
    if (clienteId) where.clienteId = clienteId;
    
    const envios = await db.promocionEnviada.findMany({
      where,
      orderBy: { fechaEnvio: 'desc' },
      include: {
        promocion: true,
        cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        empleado: { select: { id: true, nombre: true } },
      },
    });
    
    return NextResponse.json(envios);
  } catch (error) {
    console.error('Error fetching promociones enviadas:', error);
    return NextResponse.json({ error: 'Error al obtener promociones enviadas' }, { status: 500 });
  }
}

// POST - Enviar promoción (simula envío por WhatsApp)
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'promociones:create');
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  
  try {
    const data = await request.json();
    
    // Obtener la promoción
    const promocion = await db.promocion.findUnique({
      where: { id: data.promocionId },
    });
    
    if (!promocion) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }
    
    // Obtener clientes según el tipo de promoción
    let clientes: Array<{ id: string; nombre: string; apellido: string; telefono: string }> = [];
    
    if (data.clienteId) {
      // Enviar a cliente específico
      const cliente = await db.cliente.findUnique({
        where: { id: data.clienteId },
        select: { id: true, nombre: true, apellido: true, telefono: true },
      });
      if (cliente) clientes = [cliente];
    } else {
      // Enviar automáticamente según tipo
      if (promocion.tipo === 'vencimiento_proximo') {
        // Clientes con membresía por vencer en 7 días
        const hoy = new Date();
        const en7Dias = new Date();
        en7Dias.setDate(hoy.getDate() + 7);
        
        const membresiasProximas = await db.membresiaCliente.findMany({
          where: {
            estado: 'activa',
            fechaFin: { gte: hoy, lte: en7Dias },
          },
          include: {
            cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
          },
        });
        clientes = membresiasProximas.map(m => m.cliente);
        
      } else if (promocion.tipo === 'membresia_expirada') {
        // Clientes con membresía expirada
        const hoy = new Date();
        
        const membresiasExpiradas = await db.membresiaCliente.findMany({
          where: {
            estado: 'activa',
            fechaFin: { lt: hoy },
          },
          include: {
            cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
          },
        });
        clientes = membresiasExpiradas.map(m => m.cliente);
      }
    }
    
    // Crear registros de envío
    const envios = await Promise.all(
      clientes.map(cliente =>
        db.promocionEnviada.create({
          data: {
            promocionId: promocion.id,
            clienteId: cliente.id,
            empleadoId: user.empleadoId || data.empleadoId,
            estado: 'enviado',
            whatsappId: `wa_${Date.now()}_${cliente.id}`, // ID simulado
          },
          include: {
            cliente: true,
            promocion: true,
          },
        })
      )
    );
    
    // Simular envío de WhatsApp (en producción aquí iría la API real)
    console.log(`[WhatsApp] Enviando promoción "${promocion.titulo}" a ${clientes.length} clientes`);
    clientes.forEach(cliente => {
      const mensaje = promocion.plantillaWhatsApp?.replace('{nombre}', cliente.nombre) 
        || `¡Hola ${cliente.nombre}! ${promocion.titulo}.`;
      console.log(`[WhatsApp] Para: ${cliente.telefono} - ${mensaje}`);
    });
    
    return NextResponse.json({
      success: true,
      enviados: envios.length,
      clientes: clientes.map(c => ({ id: c.id, nombre: c.nombre, telefono: c.telefono })),
    });
  } catch (error) {
    console.error('Error sending promocion:', error);
    return NextResponse.json({ error: 'Error al enviar promoción' }, { status: 500 });
  }
}
