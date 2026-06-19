import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';
import { sendMessage, getState } from '@/lib/whatsapp-service';

// POST - Send WhatsApp message(s)
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'whatsapp:send');
  if ('error' in authResult) return authResult.error;
  
  try {
    const body = await request.json();
    const { type, promocionId, clienteIds, message, to } = body;

    // Check WhatsApp connection status first
    const status = getState();
    
    if (status.status !== 'connected') {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp no está conectado. Por favor, escanea el código QR primero.',
        status: status.status
      }, { status: 400 });
    }

    // Send single message
    if (type === 'single' && to && message) {
      const result = await sendMessage(to, message);
      return NextResponse.json(result);
    }

    // Send promotion to clients
    if (type === 'promotion' && promocionId && clienteIds) {
      // Get promotion details
      const promocion = await db.promocion.findUnique({
        where: { id: promocionId }
      });

      if (!promocion) {
        return NextResponse.json({
          success: false,
          error: 'Promoción no encontrada'
        }, { status: 404 });
      }

      // Get clients with their membership info
      const clientes = await db.cliente.findMany({
        where: { 
          id: { in: clienteIds }
        },
        select: { 
          id: true, 
          nombre: true, 
          apellido: true, 
          telefono: true,
          membresias: {
            where: { estado: 'activa' },
            orderBy: { fechaFin: 'desc' },
            take: 1,
            select: { fechaFin: true }
          }
        }
      });

      // Filter clients with valid phone numbers
      const clientesConTelefono = clientes.filter(c => c.telefono && c.telefono.trim() !== '');

      if (clientesConTelefono.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No hay clientes con número de teléfono válido'
        }, { status: 400 });
      }

      // Prepare message template
      const baseTemplate = promocion.plantillaWhatsApp || 
        `¡Hola {nombre}! 🎉\n\n📢 ${promocion.titulo}\n\n💸 Descuento: ${promocion.descuento}%\n📅 Válido hasta: ${new Date(promocion.validoHasta).toLocaleDateString('es-ES')}\n\n¡No te lo pierdas!`;

      // Pre-calculate promotion dates
      const fechaInicioPromocion = new Date(promocion.validoDesde).toLocaleDateString('es-ES');
      const fechaFinPromocion = new Date(promocion.validoHasta).toLocaleDateString('es-ES');
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Send messages one by one (since each has different content)
      const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
      let successCount = 0;
      let failedCount = 0;

      for (const cliente of clientesConTelefono) {
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.trim();
        
        // Calculate days remaining or expired
        let dias = 0;
        let mensajeDias = '';
        
        if (cliente.membresias.length > 0) {
          const fechaFin = new Date(cliente.membresias[0].fechaFin);
          fechaFin.setHours(0, 0, 0, 0);
          const diffTime = fechaFin.getTime() - hoy.getTime();
          dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (dias > 0) {
            mensajeDias = dias === 1 ? 'mañana' : `${dias} días`;
          } else if (dias === 0) {
            mensajeDias = 'hoy';
          } else {
            mensajeDias = dias === -1 ? 'ayer' : `hace ${Math.abs(dias)} días`;
          }
        }
        
        // Replace all variables in the template
        let personalizedMessage = baseTemplate
          .replace(/{nombre}/g, nombreCompleto)
          .replace(/{dias}/g, mensajeDias || dias.toString())
          .replace(/{DIAS}/g, dias.toString())
          .replace(/{titulo}/g, promocion.titulo)
          .replace(/{descuento}/g, promocion.descuento.toString())
          .replace(/{InicioPromocion}/g, fechaInicioPromocion)
          .replace(/{finPromocion}/g, fechaFinPromocion);

        try {
          const result = await sendMessage(cliente.telefono!, personalizedMessage);
          
          results.push({
            phone: cliente.telefono!,
            success: result.success,
            messageId: result.messageId,
            error: result.error
          });
          
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          results.push({
            phone: cliente.telefono!,
            success: false,
            error: err instanceof Error ? err.message : 'Error desconocido'
          });
          failedCount++;
        }
        
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Log sent promotions in database
      if (successCount > 0) {
        try {
          const now = Date.now();
          
          // Insert one by one to avoid SQLite limitations with skipDuplicates
          for (let i = 0; i < clientesConTelefono.length; i++) {
            if (results[i]?.success) {
              try {
                await db.promocionEnviada.create({
                  data: {
                    promocionId: promocion.id,
                    clienteId: clientesConTelefono[i].id,
                    estado: 'enviado',
                    whatsappId: results[i]?.messageId || `wa_${now}_${clientesConTelefono[i].id}`
                  }
                });
              } catch {
                // Ignore duplicates
              }
            }
          }
        } catch (dbError) {
          console.error('Error logging sent promotions:', dbError);
        }
      }

      return NextResponse.json({
        success: true,
        sent: successCount,
        failed: failedCount,
        results
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Tipo de solicitud inválido'
    }, { status: 400 });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al enviar mensaje de WhatsApp: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}