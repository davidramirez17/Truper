export type PreviewRow = { client: string; date: string; amount: number | null; region: string; errors: string[]; row: number };
export type ValidationResult = { rows: PreviewRow[]; count: number; valid: number; invalid: number; missing: string[]; limited: boolean };
export const requiredHeaders = ['Cliente', 'Fecha', 'Importe', 'Zona de ventas'];
const normalize = (value: unknown) => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX').replace(/[\s_-]+/g, '');
const aliases: Record<string, string[]> = { Cliente: ['cliente'], Fecha: ['fecha', 'fechafactura'], Importe: ['importe'], 'Zona de ventas': ['zonaventas', 'zonadeventas'] };

export function validateRows(headers: unknown[], values: unknown[][]): ValidationResult {
  const indexes = Object.fromEntries(requiredHeaders.map(header => [header, headers.findIndex(value => aliases[header].includes(normalize(value)))]));
  const missing = requiredHeaders.filter(header => indexes[header] < 0);
  const nonempty = values.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));
  const limited = nonempty.length > 10000;
  const rows = nonempty.slice(0, 10000).map((row, i): PreviewRow => {
    const client = String(row[indexes.Cliente] ?? '').trim();
    const region = String(row[indexes['Zona de ventas']] ?? '').trim();
    const raw = row[indexes.Importe];
    // Accept decimal numbers, not ambiguous thousands separators or currency text.
    const amount = (typeof raw === 'number' || (typeof raw === 'string' && /^-?\d+(\.\d{1,2})?$/.test(raw.trim()))) ? Number(raw) : NaN;
    const input = row[indexes.Fecha];
    let date = input instanceof Date && !Number.isNaN(input.getTime()) ? input.toISOString().slice(0, 10) : String(input ?? '').trim();
    if (typeof input === 'number' && input > 0 && input < 100000) date = new Date(Date.UTC(1899, 11, 30) + Math.floor(input) * 86400000).toISOString().slice(0, 10);
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : null;
    const errors = [!client && 'Falta cliente', !region && 'Falta zona', (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100))) && 'Importe inválido', (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) && 'Fecha inválida'].filter((error): error is string => Boolean(error));
    return { client, region, date, amount: Number.isFinite(amount) ? amount : null, errors, row: i + 2 };
  });
  return { rows: rows.slice(0, 50), count: rows.length, valid: rows.filter(row => !row.errors.length).length, invalid: rows.filter(row => row.errors.length).length, missing, limited };
}
