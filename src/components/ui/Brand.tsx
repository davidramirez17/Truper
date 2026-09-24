import Image from 'next/image';
export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-lockup ${compact ? 'brand-compact' : ''}`}><Image src="/brand/truper.svg" alt="Truper" width={182} height={88} priority /><span>WORKSPACE<span className="brand-edition">OPERACIÓN & ANÁLISIS</span></span></span>;
}
