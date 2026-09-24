'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="standalone-state"><h1>No pudimos abrir esta vista</h1><p>Ocurrió un problema al consultar la información. Puedes volver a intentarlo.</p><button className="button primary" onClick={reset}>Volver a intentar</button><Link href="/">Ir al resumen</Link></main>; }
