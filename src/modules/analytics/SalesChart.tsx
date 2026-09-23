'use client';

import { useId, useState } from 'react';
import { dateLabel, money } from './selectors';

type Point = { date: string; current: number; previous: number };
export function SalesChart({ points, hasData }: { points: Point[]; hasData: boolean }) {
  const id = useId().replaceAll(':', '');
  const [active, setActive] = useState<number | null>(null);
  if (!hasData) return <div className="chart-empty"><span className="empty-chart-icon">↗</span><strong>Las tendencias empiezan con tus datos</strong><p>Conecta una fuente para conocer la evolución de tus ventas.</p></div>;
  const min = Math.min(0, ...points.flatMap(point => [point.current, point.previous]));
  const max = Math.max(1, ...points.flatMap(point => [point.current, point.previous])) * 1.15;
  const width = 720, height = 230, left = 62, right = 16, bottom = 30, top = 14;
  const x = (index: number) => left + (index / Math.max(points.length - 1, 1)) * (width - left - right);
  const y = (value: number) => top + (max - value) / (max - min) * (height - top - bottom);
  const line = (key: 'current' | 'previous') => points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point[key])}`).join(' ');
  const ticks = [0, 1, 2, 3, 4].map(i => min + (max - min) * i / 4);
  return <div className="chart-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} className="sales-chart" role="img" aria-label="Ventas del periodo actual y anterior. Tabla de valores disponible debajo." onMouseLeave={() => setActive(null)}>
      <defs><linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".17" /><stop offset="100%" stopColor="var(--accent)" stopOpacity=".01" /></linearGradient></defs>
      {ticks.map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="chart-grid" /><text x={left - 12} y={y(tick) + 4} textAnchor="end">{money(tick, true)}</text></g>)}
      <path d={`${line('current')} L${x(points.length - 1)},${y(0)} L${left},${y(0)} Z`} fill={`url(#fill-${id})`} />
      <path d={line('previous')} fill="none" stroke="var(--chart-muted)" strokeWidth="2" strokeDasharray="5 5" />
      <path d={line('current')} fill="none" stroke="var(--accent)" strokeWidth="2.7" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => <g key={point.date}>
        {(index % Math.ceil(points.length / 6) === 0 || index === points.length - 1) && <text x={x(index)} y={height - 5} textAnchor={index === points.length - 1 ? 'end' : 'middle'}>{dateLabel(point.date)}</text>}
        <rect x={x(index) - (width - left) / points.length / 2} y={top} width={(width - left) / points.length} height={height - bottom - top} fill="transparent" onMouseEnter={() => setActive(index)} />
      </g>)}
      {active !== null && points[active] && <g pointerEvents="none"><line x1={x(active)} x2={x(active)} y1={top} y2={height - bottom} stroke="var(--chart-muted)" strokeDasharray="3 3" /><circle cx={x(active)} cy={y(points[active].current)} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" /></g>}
    </svg>
    <div className="chart-caption">{active !== null && points[active] ? <span>{dateLabel(points[active].date)} · <strong>{money(points[active].current)}</strong> · Anterior: {money(points[active].previous)}</span> : <span>Importes en MXN · comparación con el periodo anterior</span>}</div>
    <details className="chart-data"><summary>Ver valores de la gráfica</summary><div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Periodo actual</th><th>Periodo anterior</th></tr></thead><tbody>{points.map(point => <tr key={point.date}><td>{dateLabel(point.date)}</td><td>{money(point.current)}</td><td>{money(point.previous)}</td></tr>)}</tbody></table></div></details>
  </div>;
}
