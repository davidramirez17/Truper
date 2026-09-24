export type PreviewRow = { client: string; date: string; amount: number | null; region: string; errors: string[]; row: number };
export type ValidationResult = { rows: PreviewRow[]; count: number; valid: number; invalid: number; missing: string[]; limited: boolean };
export const requiredHeaders = ['Cliente', 'Fecha', 'Importe', 'Zona de ventas'] as const;
export type ColumnMapping = Record<typeof requiredHeaders[number], number>;
const normalize = (value: unknown) => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX').replace(/[\s_-]+/g, '');
const aliases: Record<string, string[]> = { Cliente: ['cliente','nombrecliente'], Fecha: ['fecha','fechafactura','fechadefactura'], Importe: ['importe','monto','total'], 'Zona de ventas': ['zonaventas','zonadeventas','zona','region'] };
export const inferMapping = (headers: unknown[]): ColumnMapping => Object.fromEntries(requiredHeaders.map(header => [header, headers.findIndex(value => aliases[header].includes(normalize(value)))])) as ColumnMapping;
export function validateRows(headers: unknown[], values: unknown[][], mapping?: ColumnMapping): ValidationResult {
  const indexes = mapping ?? inferMapping(headers);
  const missing = requiredHeaders.filter(header => indexes[header] < 0 || indexes[header] >= headers.length);
  const selected = requiredHeaders.map(header => indexes[header]).filter(index => index >= 0);
  if (new Set(selected).size !== selected.length) missing.push(...requiredHeaders.filter(header => selected.filter(index => index === indexes[header]).length > 1));
  const nonempty = values.map((cells,index) => ({ cells, number:index+2 })).filter(({cells}) => cells.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));
  const limited = nonempty.length > 10000;
  const rows = nonempty.slice(0,10000).map(({cells:row,number}): PreviewRow => {
    const client = String(row[indexes.Cliente] ?? '').trim();
    const region = String(row[indexes['Zona de ventas']] ?? '').trim();
    const raw = row[indexes.Importe];
    const amount = (typeof raw === 'number' || (typeof raw === 'string' && /^-?\d+(\.\d{1,2})?$/.test(raw.trim()))) ? Number(raw) : NaN;
    const input = row[indexes.Fecha];
    let date = input instanceof Date && !Number.isNaN(input.getTime()) ? input.toISOString().slice(0,10) : String(input ?? '').trim();
    if (typeof input === 'number' && Number.isFinite(input) && input > 0 && input < 100000) date = new Date(Date.UTC(1899,11,30)+Math.floor(input)*86400000).toISOString().slice(0,10);
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : null;
    const errors = [(!client || client.length>300) && 'Cliente vacío o demasiado largo', (!region || region.length>150) && 'Zona vacía o demasiado larga', (!Number.isFinite(amount) || Math.abs(amount)>1000000000 || Math.abs(amount*100-Math.round(amount*100))>.0001) && 'Importe inválido (máx. 2 decimales)', (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==date || date<'1900-01-01' || date>'2200-12-31') && 'Fecha inválida'].filter((error): error is string => Boolean(error));
    return { client,region,date,amount:Number.isFinite(amount)?amount:null,errors,row:number };
  });
  return {rows,count:rows.length,valid:rows.filter(row=>!row.errors.length).length,invalid:rows.filter(row=>row.errors.length).length,missing:[...new Set(missing)],limited};
}
