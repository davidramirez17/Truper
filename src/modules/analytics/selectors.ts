import type { Period, SalesRecord } from './types';

export const money = (cents: number, compact = false) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', maximumFractionDigits: compact ? 1 : 2,
  ...(compact ? { notation: 'compact' as const } : {}),
}).format(cents / 100);
export const number = (value: number) => new Intl.NumberFormat('es-MX').format(value);
export const dateLabel = (date: string, long = false) => new Intl.DateTimeFormat('es-MX', {
  day: 'numeric', month: long ? 'long' : 'short', ...(long ? { year: 'numeric' as const } : {}), timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`));
export const shiftDate = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export function selectAnalytics(records: SalesRecord[], asOf: string, days: Period, project = 'all') {
  const scoped = records.filter(row => project === 'all' || row.projectId === project);
  const start = shiftDate(asOf, 1 - days);
  const previousStart = shiftDate(start, -days);
  const current = scoped.filter(row => row.date >= start && row.date <= asOf);
  const previous = scoped.filter(row => row.date >= previousStart && row.date < start);
  const total = current.reduce((sum, row) => sum + row.amountCents, 0);
  const previousTotal = previous.reduce((sum, row) => sum + row.amountCents, 0);
  const trend = Array.from({ length: days }, (_, index) => {
    const date = shiftDate(start, index);
    const prev = shiftDate(date, -days);
    return {
      date,
      current: current.filter(row => row.date === date).reduce((sum, row) => sum + row.amountCents, 0),
      previous: previous.filter(row => row.date === prev).reduce((sum, row) => sum + row.amountCents, 0),
    };
  });
  const regions = Object.entries(current.reduce<Record<string, number>>((acc, row) => {
    acc[row.region] = (acc[row.region] ?? 0) + row.amountCents;
    return acc;
  }, {})).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  return {
    current, previous, start, total, previousTotal, trend, regions,
    change: previousTotal > 0 ? (total - previousTotal) / previousTotal * 100 : null,
    clients: new Set(current.map(row => row.client)).size,
    average: current.length ? Math.round(total / current.length) : null,
  };
}

export function csvText(records: SalesRecord[]) {
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [['Referencia', 'Proyecto', 'Fecha', 'Cliente', 'Zona', 'Importe MXN'],
    ...records.map(row => [row.id, row.projectId, row.date, row.client, row.region, (row.amountCents / 100).toFixed(2)])]
    .map(row => row.map(cell).join(',')).join('\r\n');
}
