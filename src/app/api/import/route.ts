import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// POST - Import data
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await requireAuth(request, 'import:write');
  if ('error' in authResult) return authResult.error;
  
  try {
    const body = await request.json();
    const { type, data, options, format } = body;

    if (!type) {
      return NextResponse.json({ error: 'Tipo de importación requerido' }, { status: 400 });
    }

    let parsedData: Record<string, unknown>[] = [];

    // Parse data based on format
    if (format === 'csv') {
      parsedData = parseCSV(data);
    } else {
      if (!data) {
        return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
      }
      parsedData = Array.isArray(data) ? data : [data];
    }

    if (parsedData.length === 0) {
      return NextResponse.json({ error: 'No se encontraron datos para importar' }, { status: 400 });
    }

    const result = {
      type,
      total: parsedData.length,
      exitosos: 0,
      errores: [] as string[],
      creados: [] as unknown[],
    };

    switch (type) {
      case 'clientes':
        return await importClientes(parsedData, options, result);
      case 'membresias':
        return await importMembresias(parsedData, options, result);
      case 'planes':
        return await importPlanes(parsedData, options, result);
      default:
        return NextResponse.json({ error: 'Tipo de importación no válido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Error al importar datos' }, { status: 500 });
  }
}

// Parse CSV string to array of objects
function parseCSV(csvString: string): Record<string, unknown>[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse rows
  const data: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert empty strings to empty, keep the value
        row[header] = value;
      });
      data.push(row);
    }
  }

  return data;
}

// Parse a single CSV line handling quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function importClientes(
  data: Record<string, unknown>[],
  options: { ignorarDuplicados?: boolean; actualizarExistentes?: boolean } = {},
  result: { type: string; total: number; exitosos: number; errores: string[]; creados: unknown[] }
) {
  for (const row of data) {
    try {
      // Validar campos requeridos
      const nombre = String(row.Nombre || row.nombre || '').trim();
      const apellido = String(row.Apellido || row.apellido || '').trim();
      const email = String(row.Email || row.email || '').trim().toLowerCase();
      const telefono = String(row.Telefono || row.telefono || '').trim();

      if (!nombre || !apellido || !email || !telefono) {
        result.errores.push(`Fila ${result.exitosos + result.errores.length + 1}: Faltan campos requeridos (nombre, apellido, email, telefono)`);
        continue;
      }

      // Verificar si existe
      const existente = await db.cliente.findFirst({
        where: {
          OR: [
            { email },
            { dni: String(row.DNI || row.dni || '') },
          ].filter(Boolean),
        },
      });

      if (existente) {
        if (options.actualizarExistentes) {
          const actualizado = await db.cliente.update({
            where: { id: existente.id },
            data: {
              nombre,
              apellido,
              telefono,
              dni: String(row.DNI || row.dni || existente.dni || '') || null,
              direccion: String(row.Direccion || row.direccion || existente.direccion || '') || null,
            },
          });
          result.creados.push(actualizado);
          result.exitosos++;
        } else if (!options.ignorarDuplicados) {
          result.errores.push(`Cliente duplicado: ${email}`);
        }
        continue;
      }

      // Crear cliente
      const codigoAcceso = generarCodigoAcceso();
      
      const cliente = await db.cliente.create({
        data: {
          nombre,
          apellido,
          email,
          telefono,
          dni: String(row.DNI || row.dni || '') || null,
          direccion: String(row.Direccion || row.direccion || '') || null,
          codigoAcceso,
          huellaBiometrica: String(row.Huella_Biometrica || row.huellaBiometrica || '') || null,
          activo: true,
        },
      });

      result.creados.push(cliente);
      result.exitosos++;
    } catch (err) {
      const error = err as Error;
      result.errores.push(`Error en fila ${result.exitosos + result.errores.length + 1}: ${error.message}`);
    }
  }

  return NextResponse.json(result);
}

async function importMembresias(
  data: Record<string, unknown>[],
  options: { ignorarDuplicados?: boolean } = {},
  result: { type: string; total: number; exitosos: number; errores: string[]; creados: unknown[] }
) {
  for (const row of data) {
    try {
      const clienteEmail = String(row.Email || row.email || '').trim().toLowerCase();
      const planNombre = String(row.Plan || row.plan || '').trim();
      const fechaInicio = row.Fecha_Inicio || row.fechaInicio ? new Date(String(row.Fecha_Inicio || row.fechaInicio)) : new Date();
      const precioPagado = Number(row.Precio_Pagado || row.precioPagado || row.Ingreso || row.ingreso || 0);
      const metodoPago = String(row.Metodo_Pago || row.metodoPago || 'Efectivo');

      if (!clienteEmail || !planNombre) {
        result.errores.push(`Fila ${result.exitosos + result.errores.length + 1}: Faltan campos requeridos`);
        continue;
      }

      // Buscar cliente
      const cliente = await db.cliente.findFirst({
        where: { email: clienteEmail },
      });

      if (!cliente) {
        result.errores.push(`Cliente no encontrado: ${clienteEmail}`);
        continue;
      }

      // Buscar plan
      const plan = await db.membresia.findFirst({
        where: { nombre: { contains: planNombre, mode: 'insensitive' } },
      });

      if (!plan) {
        result.errores.push(`Plan no encontrado: ${planNombre}`);
        continue;
      }

      // Calcular fecha fin
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + plan.duracionDias);

      // Verificar membresía activa existente
      const membresiaActiva = await db.membresiaCliente.findFirst({
        where: { clienteId: cliente.id, estado: 'activa' },
      });

      if (membresiaActiva && !options.ignorarDuplicados) {
        result.errores.push(`Cliente ${clienteEmail} ya tiene membresía activa`);
        continue;
      }

      // Crear membresía
      const membresia = await db.membresiaCliente.create({
        data: {
          clienteId: cliente.id,
          membresiaId: plan.id,
          fechaInicio,
          fechaFin,
          precioPagado,
          metodoPago,
        },
      });

      result.creados.push(membresia);
      result.exitosos++;
    } catch (err) {
      const error = err as Error;
      result.errores.push(`Error en fila ${result.exitosos + result.errores.length + 1}: ${error.message}`);
    }
  }

  return NextResponse.json(result);
}

async function importPlanes(
  data: Record<string, unknown>[],
  options: { ignorarDuplicados?: boolean; actualizarExistentes?: boolean } = {},
  result: { type: string; total: number; exitosos: number; errores: string[]; creados: unknown[] }
) {
  for (const row of data) {
    try {
      const nombre = String(row.Nombre || row.nombre || '').trim();
      const precio = Number(row.Precio || row.precio || 0);
      const duracionDias = Number(row.Duracion_Dias || row.duracionDias || row.Dias || row.dias || 30);
      const descripcion = String(row.Descripcion || row.descripcion || '');

      if (!nombre || !precio) {
        result.errores.push(`Fila ${result.exitosos + result.errores.length + 1}: Faltan campos requeridos`);
        continue;
      }

      // Verificar si existe
      const existente = await db.membresia.findFirst({
        where: { nombre: { equals: nombre, mode: 'insensitive' } },
      });

      if (existente) {
        if (options.actualizarExistentes) {
          const actualizado = await db.membresia.update({
            where: { id: existente.id },
            data: { precio, duracionDias, descripcion: descripcion || existente.descripcion },
          });
          result.creados.push(actualizado);
          result.exitosos++;
        } else if (!options.ignorarDuplicados) {
          result.errores.push(`Plan duplicado: ${nombre}`);
        }
        continue;
      }

      // Crear plan
      const plan = await db.membresia.create({
        data: {
          nombre,
          precio,
          duracionDias,
          descripcion: descripcion || null,
        },
      });

      result.creados.push(plan);
      result.exitosos++;
    } catch (err) {
      const error = err as Error;
      result.errores.push(`Error en fila ${result.exitosos + result.errores.length + 1}: ${error.message}`);
    }
  }

  return NextResponse.json(result);
}

function generarCodigoAcceso(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}
