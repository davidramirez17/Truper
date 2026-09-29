'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, Check, CheckCircle2, Clock3, Copy, Database, Gauge, HardDrive, RefreshCw, ShieldCheck, Table2, Wrench } from 'lucide-react';
import type { SystemHealth, SystemHealthTable } from '../analytics/types';

const bytes = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'No disponible';
  if (value < 1024) return `${Math.round(value)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let index = -1;
  while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index += 1; }
  return `${amount.toLocaleString('es-MX', { maximumFractionDigits: amount >= 100 ? 0 : 1 })} ${units[index]}`;
};

const count = (value: number | null | undefined) => value === null || value === undefined ? 'No disponible' : value.toLocaleString('es-MX');
const date = (value: string | null) => value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date(value)) : 'No registrado';
const tableNames: Record<string, string> = {
  truper_profiles: 'Perfiles',
  truper_projects: 'Proyectos',
  truper_project_members: 'Miembros de proyecto',
  truper_imports: 'Cargas',
  truper_sales_rows: 'Movimientos de venta',
  truper_audit: 'Auditoría',
};

function deadRatio(table: SystemHealthTable) {
  const total = table.liveTuples + table.deadTuples;
  return total ? table.deadTuples / total : 0;
}

function recommendations(health: SystemHealth) {
  const items: { tone: 'info' | 'warning' | 'success'; title: string; text: string }[] = [];
  if (!health.databaseLimitBytes) items.push({ tone: 'info', title: 'Configura el límite del plan', text: 'Define SUPABASE_DATABASE_LIMIT_BYTES en el entorno server-only para mostrar porcentaje de uso contra el límite contratado.' });
  if (health.databaseLimitBytes && health.databaseSizeBytes / health.databaseLimitBytes >= .8) items.push({ tone: 'warning', title: 'El espacio merece revisión', text: 'La base supera 80% del límite configurado. Revisa cargas históricas y archivos de origen antes de crecer el plan.' });
  health.tables.filter(table => deadRatio(table) >= .1).forEach(table => items.push({ tone: 'warning', title: `Revisar mantenimiento de ${tableNames[table.name] ?? table.name}`, text: `Tiene ${(deadRatio(table) * 100).toFixed(1)}% de tuplas muertas. Ejecuta VACUUM (ANALYZE) desde el SQL Editor de Supabase después de revisar el impacto.` }));
  health.tables.filter(table => table.seqScans > 100 && table.idxScans === 0).forEach(table => items.push({ tone: 'info', title: `Revisar índices de ${tableNames[table.name] ?? table.name}`, text: 'La estadística muestra lecturas secuenciales y ningún uso de índice desde el último reinicio de estadísticas. Confirma el patrón real antes de crear índices.' }));
  if (!items.length) items.push({ tone: 'success', title: 'No hay señales críticas', text: 'El espacio y las estadísticas disponibles no muestran una acción urgente. Continúa observando después de cargar el primer Excel real.' });
  return items;
}

const maintenanceSql = `-- Revisar primero en Supabase SQL Editor.
-- No ejecutar desde el navegador ni sobre datos sin respaldo.
VACUUM (ANALYZE) public.truper_sales_rows;
VACUUM (ANALYZE) public.truper_imports;
VACUUM (ANALYZE) public.truper_audit;`;

function Stat({ icon: Icon, label, value, detail }: { icon: typeof Database; label: string; value: string; detail: string }) {
  return <article className="health-stat"><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function StorageBar({ health }: { health: SystemHealth }) {
  const percent = health.databaseLimitBytes ? Math.min(100, health.databaseSizeBytes / health.databaseLimitBytes * 100) : null;
  return <section className="panel health-storage"><div className="panel-heading"><div><h2>Espacio ocupado en Supabase</h2><p>Tamaño total de la base según PostgreSQL, sin inventar un límite de plan.</p></div><span className="chip"><HardDrive size={14} />Base de datos</span></div><div className="health-storage-main"><div><strong>{bytes(health.databaseSizeBytes)}</strong><span>{percent === null ? 'Límite no configurado' : `${percent.toFixed(1)}% del límite configurado`}</span></div>{percent !== null ? <div className="health-progress" role="progressbar" aria-label="Uso de la base de datos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(percent.toFixed(1))}><i className={percent >= 80 ? 'is-warning' : ''} style={{ width: `${percent}%` }} /></div> : <div className="health-progress is-unknown" aria-label="Límite de base de datos no configurado"><i /></div>}<div className="health-storage-foot"><span>Tablas monitoreadas: {health.tables.length}</span><span>{health.databaseLimitBytes ? `Límite: ${bytes(health.databaseLimitBytes)}` : 'Añade SUPABASE_DATABASE_LIMIT_BYTES para calcularlo'}</span></div></div></section>;
}

export function SystemHealthView({ health }: { health?: SystemHealth }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const data = health;
  const items = data ? recommendations(data) : [];
  async function copyPlan() {
    try { await navigator.clipboard.writeText(maintenanceSql); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  }
  function refresh() { startTransition(() => router.refresh()); }
  if (!data) return <section className="panel health-unavailable"><AlertTriangle size={25} /><h2>Salud del sistema no disponible</h2><p>Actualiza la vista para volver a consultar las métricas del superusuario.</p><button className="button secondary" onClick={refresh} disabled={pending}><RefreshCw size={16} className={pending ? 'spin' : ''} />Reintentar</button></section>;
  return <>
    <div className="health-toolbar"><div><span className="health-live"><i />Lectura protegida por Supabase</span><p>Última lectura: {date(data.generatedAt)} · La latencia mide únicamente esta consulta de observabilidad.</p></div><button className="button secondary" onClick={refresh} disabled={pending}><RefreshCw size={16} className={pending ? 'spin' : ''} />Actualizar métricas</button></div>
    {data.error && <div className="notice warning"><AlertTriangle size={19} /><p>{data.error}</p></div>}
    {!data.error && <>
      <section className="health-stats" aria-label="Indicadores de salud"><Stat icon={Database} label="BASE DE DATOS" value={bytes(data.databaseSizeBytes)} detail="Tamaño total reportado" /><Stat icon={Gauge} label="LATENCIA DE LECTURA" value={`${data.queryMs} ms`} detail="RPC protegido del sistema" /><Stat icon={Activity} label="CACHE DE LECTURA" value={data.cacheHitRatio === null ? '—' : `${data.cacheHitRatio.toFixed(1)}%`} detail="Lecturas resueltas desde caché" /><Stat icon={Table2} label="TABLAS OBSERVADAS" value={count(data.tables.length)} detail="Relaciones de Truper" /></section>
      <div className="health-layout"><StorageBar health={data} /><section className="panel health-pulse"><div className="panel-heading"><div><h2>Rendimiento de la base</h2><p>Señales agregadas; no sustituyen un APM ni una prueba de carga.</p></div><span className="chip"><Activity size={14} />PostgreSQL</span></div><div className="health-pulse-grid"><div><small>Conexiones activas</small><strong>{count(data.activeConnections)}</strong></div><div><small>Transacciones confirmadas</small><strong>{count(data.commits)}</strong></div><div><small>Transacciones revertidas</small><strong>{count(data.rollbacks)}</strong></div><div><small>Temporales escritos</small><strong>{bytes(data.tempBytes)}</strong></div></div><div className="panel-footnote"><ShieldCheck size={13} />La consulta requiere rol superadmin y no expone filas de negocio.</div></section></div>
      <section className="panel health-tables"><div className="panel-heading"><div><h2>Qué tabla ocupa más</h2><p>El tamaño incluye datos e índices. Las filas son estimaciones de PostgreSQL.</p></div><span className="chip">Orden alfabético</span></div><div className="table-scroll"><table><thead><tr><th>TABLA</th><th>TAMAÑO TOTAL</th><th>ÍNDICES</th><th>FILAS ESTIMADAS</th><th>TUPLAS MUERTAS</th><th>ÚLTIMO ANÁLISIS</th></tr></thead><tbody>{data.tables.map(table => { const ratio = deadRatio(table); return <tr key={table.name}><td><span className="health-table-name"><i><Table2 size={15} /></i><strong>{tableNames[table.name] ?? table.name}</strong><small>{table.name}</small></span></td><td className="amount">{bytes(table.totalBytes)}</td><td>{bytes(table.indexBytes)}</td><td>{count(table.rowsEstimate)}</td><td><span className={ratio >= .1 ? 'health-risk' : 'health-ok'}>{(ratio * 100).toFixed(1)}% · {count(table.deadTuples)}</span></td><td>{date(table.lastAnalyze)}</td></tr>; })}</tbody></table></div>{!data.tables.length && <div className="empty-state"><Table2 size={30} /><h3>No hay tablas reportadas</h3><p>Confirma que la migración de observabilidad esté aplicada en Supabase.</p></div>}</section>
      <div className="health-bottom-grid"><section className="panel health-recommendations"><div className="panel-heading"><div><h2>Optimización segura</h2><p>Recomendaciones accionables sin borrar ni modificar datos automáticamente.</p></div><Wrench size={21} /></div><div className="health-recommendation-list">{items.map(item => <article className={`health-recommendation ${item.tone}`} key={`${item.title}-${item.text}`}><span>{item.tone === 'success' ? <CheckCircle2 size={17} /> : item.tone === 'warning' ? <AlertTriangle size={17} /> : <Clock3 size={17} />}</span><div><strong>{item.title}</strong><p>{item.text}</p></div></article>)}</div></section><section className="panel health-maintenance"><div className="panel-heading"><div><h2>Checklist de mantenimiento</h2><p>Copia el SQL y ejecútalo solo después de revisar el respaldo y la ventana de mantenimiento.</p></div></div><pre><code>{maintenanceSql}</code></pre><button className="button secondary" onClick={copyPlan}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'SQL copiado' : 'Copiar checklist SQL'}</button><p className="quiet-note">VACUUM no se ejecuta desde esta pantalla. La plataforma solo observa y recomienda.</p></section></div>
    </>}
  </>;
}
