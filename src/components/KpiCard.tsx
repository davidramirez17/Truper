type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: 'sky' | 'emerald' | 'amber';
};

const toneClasses = {
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
};

export function KpiCard({ label, value, detail, tone = 'sky' }: KpiCardProps) {
  return (
    <article className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium">{detail}</p>
    </article>
  );
}
