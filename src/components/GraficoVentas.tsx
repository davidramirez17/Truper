type PuntoGrafico = { etiqueta: string; valor: number };

type GraficoVentasProps = { datos: PuntoGrafico[] };

export function GraficoVentas({ datos }: GraficoVentasProps) {
  const maximo = Math.max(...datos.map((dato) => dato.valor), 1);

  return (
    <div className="space-y-4" aria-label="Ventas por periodo">
      {datos.map((dato) => (
        <div key={dato.etiqueta} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 text-sm">
          <span className="font-medium text-slate-600">{dato.etiqueta}</span>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${(dato.valor / maximo) * 100}%` }} />
          </div>
          <span className="font-bold text-slate-900">${dato.valor.toLocaleString('es-MX')}</span>
        </div>
      ))}
    </div>
  );
}
