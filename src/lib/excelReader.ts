import fs from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';

export type FilaFacturacion = {
  cliente?: string;
  zonaVentas?: string;
  gerencia?: string;
  fechaFactura?: string | number;
  semanaVenta?: string | number;
  importe?: number;
  impuesto?: number;
  [key: string]: unknown;
};

export type ResultadoExcel<T> =
  | { ok: true; data: T[]; archivo: string }
  | { ok: false; code: 'MISSING_FILE' | 'INVALID_FILE' | 'READ_ERROR'; message: string; archivo: string };

function normalizarFila(row: Record<string, unknown>): FilaFacturacion {
  return {
    ...row,
    cliente: String(row.cliente ?? row.Cliente ?? ''),
    zonaVentas: String(row.zonaVentas ?? row['Zona de ventas'] ?? ''),
    gerencia: String(row.gerencia ?? row.Gerencia ?? ''),
    importe: Number(row.importe ?? row.Importe ?? 0),
    impuesto: Number(row.impuesto ?? row.Impuesto ?? 0),
  };
}

export async function leerFacturacion(archivo = 'diario-facturacion.xlsx'): Promise<ResultadoExcel<FilaFacturacion>> {
  const directorio = process.env.EXCEL_SOURCE_PATH;
  const ubicacion = directorio ? path.join(directorio, archivo) : archivo;

  try {
    await fs.access(ubicacion);
  } catch {
    return {
      ok: false,
      code: 'MISSING_FILE',
      archivo,
      message: `No se encontró el archivo de origen: ${archivo}`,
    };
  }

  try {
    const contenido = await fs.readFile(ubicacion);
    const libro = XLSX.read(contenido, { type: 'buffer', cellDates: true });
    const primeraHoja = libro.SheetNames[0];

    if (!primeraHoja) {
      return { ok: false, code: 'INVALID_FILE', archivo, message: 'El archivo no contiene hojas.' };
    }

    const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      libro.Sheets[primeraHoja],
      { defval: null },
    );

    return { ok: true, data: filas.map(normalizarFila), archivo };
  } catch (error) {
    return {
      ok: false,
      code: 'READ_ERROR',
      archivo,
      message: error instanceof Error ? error.message : 'No fue posible leer el archivo.',
    };
  }
}
