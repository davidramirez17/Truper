import 'server-only';
import { leerFacturacion } from '@/lib/excelReader';
import { supabase } from '@/lib/supabase';
import { demoData } from './demo';
import type { WorkspaceData, SalesRecord } from './types';

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 100000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 10);
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return null;
  const date = value.slice(0, 10);
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

export async function getWorkspaceData(mode: 'demo' | 'real'): Promise<WorkspaceData> {
  if (mode === 'demo') return demoData;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
  const data: WorkspaceData = {
    mode, asOf: today, records: [], alerts: [],
    projects: [
      { id: 'facturacion', name: 'Diario de facturación', description: 'Facturación normalizada desde el archivo de origen.', initials: 'DF', color: 'orange', status: 'unconfigured', source: 'diario-facturacion.xlsx', owner: 'Sin responsable asignado', updatedAt: null },
      { id: 'consolidado', name: 'Consolidado de ventas', description: 'Último indicador disponible en Supabase. Se presenta por separado para evitar duplicar facturación.', initials: 'CV', color: 'blue', status: 'unconfigured', source: 'Supabase · kpis_ventas', owner: 'Sin responsable asignado', updatedAt: null },
    ],
  };
  // Reading the dashboard never sends mail or mutates the source.
  const excel = await leerFacturacion();
  if (excel.ok) {
    let invalid = 0;
    const normalized: SalesRecord[] = [];
    excel.data.forEach((row, index) => {
      const date = parseDate(row.fechaFactura ?? row['Fecha factura'] ?? row.Fecha ?? row.fecha);
      const cents = Math.round(Number(row.importe) * 100);
      if (!date || !Number.isSafeInteger(cents) || !row.cliente?.trim()) { invalid++; return; }
      normalized.push({ id: `F-${index + 1}`, projectId: 'facturacion', date, client: row.cliente, region: row.zonaVentas || 'Sin zona', amountCents: cents });
    });
    const latest = normalized.map(row => row.date).sort().at(-1) ?? null;
    data.records = normalized;
    data.projects[0].status = invalid ? 'attention' : 'ready';
    data.projects[0].updatedAt = latest;
    if (latest) data.asOf = latest;
    if (invalid) data.alerts.push({ id: 'invalid-rows', projectId: 'facturacion', severity: 'warning', title: `${invalid} filas requieren revisión`, message: 'Se excluyeron filas sin cliente, importe válido o fecha reconocible. Revisa el archivo original.' });
  } else {
    data.projects[0].message = excel.code === 'MISSING_FILE' ? 'Agrega el archivo en la carpeta de origen configurada.' : 'No fue posible leer la fuente. Revisa el formato del archivo.';
    data.alerts.push({ id: 'excel-source', projectId: 'facturacion', severity: 'warning', title: 'Conecta tu archivo de facturación', message: data.projects[0].message });
  }
  if (supabase) {
    try {
      const { data: row, error } = await supabase.from('kpis_ventas').select('ventas_totales, kpi_semanal, fecha').order('fecha', { ascending: false }).limit(1).maybeSingle().abortSignal(AbortSignal.timeout(6000));
      const amount = row?.ventas_totales;
      const cents = Math.round(Number(amount) * 100);
      const date = parseDate(row?.fecha);
      if (error || amount === null || amount === undefined || amount === '' || !Number.isSafeInteger(cents) || !date) throw new Error('Invalid snapshot');
      data.snapshot = { amountCents: cents, weekly: String(row?.kpi_semanal ?? 'Sin comparativo'), date };
      data.projects[1].status = 'ready';
      data.projects[1].updatedAt = date;
    } catch {
      data.projects[1].status = 'attention';
      data.projects[1].message = 'No fue posible consultar el indicador. Verifica conexión, permisos y formato.';
      data.alerts.push({ id: 'supabase-read', projectId: 'consolidado', severity: 'error', title: 'Revisa la conexión de ventas', message: data.projects[1].message });
    }
  } else {
    data.projects[1].message = 'Configura la conexión a Supabase para consultar indicadores.';
  }
  return data;
}
