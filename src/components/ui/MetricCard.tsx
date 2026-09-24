import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
export type MetricCardProps = { label: string; value: string; detail: string; icon: LucideIcon; primary?: boolean; change?: number | null };
export function MetricCard({ label, value, detail, icon: Icon, primary, change }: MetricCardProps) {
  return <article className={`metric-card ${primary ? 'metric-primary' : ''}`}><div className="metric-label"><span>{label}</span><Icon size={18} strokeWidth={1.6} /></div><strong className="metric-value">{value}</strong><div className="metric-bottom">{change !== undefined && change !== null ? <><span className={`metric-change ${change < 0 ? 'negative' : ''}`}>{change < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}{Math.abs(change).toFixed(1)}%</span><span>vs. periodo anterior</span></> : <><span className="metric-detail-dot" /><span>{detail}</span></>}</div></article>;
}
