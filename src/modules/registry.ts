// Every process declares its own data contract and metric definitions.
// Adding navigation is not sufficient to register a working module.
export const moduleRegistry = {
  ventas: {
    id: 'ventas', name: 'Ventas y facturación', version: 1,
    requiredFields: ['date', 'client', 'region', 'amountCents'],
    metrics: [
      { id: 'sales', label: 'Ventas del periodo', unit: 'MXN', definition: 'Suma de importes de las filas del periodo seleccionado.' },
      { id: 'records', label: 'Movimientos', unit: 'registros', definition: 'Número de filas normalizadas; no equivale a facturas únicas.' },
      { id: 'clients', label: 'Clientes con movimiento', unit: 'clientes', definition: 'Nombres distintos de cliente en el periodo.' },
      { id: 'average', label: 'Importe promedio', unit: 'MXN', definition: 'Suma de importes dividida entre movimientos.' },
    ],
  },
} as const;
