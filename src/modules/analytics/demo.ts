import type { WorkspaceData, SalesRecord } from './types';

const clients = [
  ['Ferretería El Tornillo', 'Centro'],
  ['Materiales del Norte', 'Norte'],
  ['Distribuidora Madero', 'Centro'],
  ['Ferretera del Bajío', 'Bajío'],
  ['Suministros del Pacífico', 'Pacífico'],
  ['Herramientas del Sureste', 'Sureste'],
  ['Comercial San José', 'Bajío'],
  ['Grupo Constructor Atlas', 'Norte'],
];

// Fixed, synthetic fixtures. Never merged into the real-data adapter.
const records: SalesRecord[] = [];
for (let day = 0; day < 60; day++) {
  const date = new Date(Date.UTC(2026, 6, 25 + day)).toISOString().slice(0, 10);
  for (let i = 0; i < 6; i++) {
    const client = clients[(day + i * 3) % clients.length];
    records.push({
      id: `DEMO-${String(day * 6 + i + 1).padStart(5, '0')}`,
      projectId: i < 4 ? 'facturacion' : 'mayoreo',
      date,
      client: client[0],
      region: client[1],
      amountCents: Math.round((12300 + ((day * 791 + i * 4327) % 23500)) * (day > 29 ? 1.16 : 1) * 100),
    });
  }
}

export const demoData: WorkspaceData = {
  mode: 'demo',
  asOf: '2026-09-22',
  projects: [
    { id: 'facturacion', name: 'Diario de facturación', description: 'Cada factura, una mejor decisión. Seguimiento de importes, clientes y zonas de venta.', initials: 'DF', color: 'orange', status: 'ready', source: 'diario-facturacion.xlsx', owner: 'Equipo comercial', updatedAt: '2026-09-22' },
    { id: 'mayoreo', name: 'Ventas de mayoreo', description: 'Operación de distribuidores y cuentas de mayoreo en un solo lugar.', initials: 'VM', color: 'blue', status: 'attention', source: 'ventas-mayoreo.xlsx', owner: 'Ventas de mayoreo', updatedAt: '2026-09-22', message: 'El archivo de la siguiente carga tiene columnas por revisar. Los datos anteriores siguen disponibles.' },
    { id: 'inventario', name: 'Control de inventario', description: 'El siguiente paso: conectar existencias, disponibilidad y rotación de productos.', initials: 'CI', color: 'purple', status: 'planned', source: 'Sin fuente asignada', owner: 'Por definir', updatedAt: null },
  ],
  records,
  alerts: [
    { id: 'demo-columns', projectId: 'mayoreo', severity: 'warning', title: 'Una fuente necesita revisión', message: 'La siguiente carga de ventas-mayoreo.xlsx no incluye la columna Importe. Revisa el archivo antes de incorporarlo.' },
    { id: 'demo-inventory', projectId: 'inventario', severity: 'info', title: 'Tu siguiente proyecto está listo para planearse', message: 'Define la fuente y las métricas de inventario para conectar un nuevo proceso.' },
  ],
};
