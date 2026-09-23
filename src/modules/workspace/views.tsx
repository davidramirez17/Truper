'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Activity, AlertCircle, ArrowDown, ArrowDownToLine, ArrowRight, ArrowUp, ArrowUpRight, BarChart3, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Database, FileSpreadsheet, FolderKanban, HardDrive, Info, Layers3, Monitor, Moon, Plus, Search, ShieldCheck, Sparkles, Sun, TrendingUp, Users, Wallet } from 'lucide-react';
import { SalesChart } from '../analytics/SalesChart';
import { dateLabel, money, number, type selectAnalytics } from '../analytics/selectors';
import type { Project, SalesRecord, WorkspaceData } from '../analytics/types';

type Props = {
  data: WorkspaceData;
  analytics: ReturnType<typeof selectAnalytics>;
  href: (path: string) => string;
  onUpload: () => void;
  onExport: (records?: SalesRecord[]) => void;
};
const statusLabels = { ready: 'Al día', attention: 'Requiere revisión', unconfigured: 'Por conectar', planned: 'Próximamente' };
export function Status({ project }: { project: Project }) { return <span className={`badge badge-${project.status}`}><i />{statusLabels[project.status]}</span>; }
function ProjectIcon({ project }: { project: Project }) { return <span className={`project-icon color-${project.color}`}><FileSpreadsheet size={21} strokeWidth={1.6} /></span>; }
function PanelTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) { return <div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</div>; }
function Empty({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) { return <div className="empty-state"><span className="empty-icon"><FileSpreadsheet size={28} strokeWidth={1.3} /></span><h3>{title}</h3><p>{message}</p>{action}</div>; }

function Metrics({ analytics, data }: Pick<Props, 'analytics' | 'data'>) {
  const hasData = analytics.current.length > 0;
  const cards = [
    { label: 'Ventas del periodo', value: hasData ? money(analytics.total) : '—', icon: Wallet, detail: 'Importe sin impuestos', primary: true },
    { label: 'Movimientos', value: hasData ? number(analytics.current.length) : '—', icon: FileSpreadsheet, detail: 'Registros en el periodo' },
    { label: 'Clientes con movimiento', value: hasData ? number(analytics.clients) : '—', icon: Users, detail: 'Clientes únicos por nombre' },
    { label: 'Importe promedio', value: analytics.average !== null ? money(analytics.average) : '—', icon: BarChart3, detail: 'Por movimiento registrado' },
  ];
  return <section className="metrics-grid" aria-label="Indicadores del periodo">{cards.map(card => <article className={`metric-card ${card.primary ? 'metric-primary' : ''}`} key={card.label}><div className="metric-label"><span>{card.label}</span><card.icon size={18} strokeWidth={1.6} /></div><strong className="metric-value">{card.value}</strong><div className="metric-bottom">{card.primary && analytics.change !== null ? <><span className={`metric-change ${analytics.change < 0 ? 'negative' : ''}`}>{analytics.change < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}{Math.abs(analytics.change).toFixed(1)}%</span><span>vs. periodo anterior</span></> : <><span className="metric-detail-dot" /><span>{hasData ? card.detail : 'Sin registros en el periodo'}</span></>}</div>{card.primary && <svg className="metric-spark" viewBox="0 0 100 36" aria-hidden="true"><path d="M0 32L9 25L18 28L29 15L40 20L52 13L64 16L77 4L86 9L100 0" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</article>)}<span className="sr-only">{data.mode === 'demo' ? 'Todos los indicadores son de demostración.' : 'Los indicadores corresponden a los registros de tus fuentes.'}</span></section>;
}

function TrendPanel({ analytics }: Pick<Props, 'analytics'>) { return <section className="panel trend-panel"><PanelTitle title="Así se mueven tus ventas" subtitle="Una mirada a la evolución de tu operación."><span className="chip">MXN</span></PanelTitle><div className="chart-summary"><strong>{analytics.current.length ? money(analytics.total) : 'Sin datos'}</strong><div className="chart-legend"><span><i className="legend-current" />Periodo actual</span><span><i className="legend-previous" />Periodo anterior</span></div></div><SalesChart points={analytics.trend} hasData={!!analytics.current.length} /></section>; }

function RegionsPanel({ analytics }: Pick<Props, 'analytics'>) {
  const positiveTotal = analytics.regions.reduce((sum, region) => sum + Math.max(0, region.amount), 0);
  return <section className="panel regions-panel"><PanelTitle title="Ventas por zona" subtitle="Dónde está tu mayor impulso." />{analytics.regions.length ? <><div className="region-total"><span>{analytics.regions.length} zonas de venta</span><span>PARTICIPACIÓN</span></div><div className="region-list">{analytics.regions.slice(0, 5).map((region, index) => <div className="region" key={region.name}><div><span><i className={`region-dot region-${index}`} />{region.name}</span><strong>{positiveTotal ? (Math.max(0, region.amount) / positiveTotal * 100).toFixed(1) : '0'}<small>%</small></strong></div><div className="region-track"><span className={`region-fill region-${index}`} style={{ width: `${positiveTotal ? Math.max(0, region.amount) / positiveTotal * 100 : 0}%` }} /></div><small>{money(region.amount)}</small></div>)}</div><div className="panel-footnote"><Info size={13} />Participación sobre importes positivos.</div></> : <Empty title="Conoce tus zonas" message="La distribución aparecerá cuando cargues registros de ventas." />}</section>;
}

function ProjectsTable({ data, analytics, href }: Props) {
  return <div className="table-scroll"><table className="projects-table"><thead><tr><th>PROYECTO</th><th>ESTADO</th><th>VENTAS DEL PERIODO</th><th>ÚLTIMO DATO</th><th><span className="sr-only">Abrir</span></th></tr></thead><tbody>{data.projects.map(project => { const records = analytics.current.filter(row => row.projectId === project.id); return <tr key={project.id}><td><Link href={href(`/proyectos/${project.id}`)} className="project-name"><ProjectIcon project={project} /><span><strong>{project.name}</strong><small>{project.source}</small></span></Link></td><td><Status project={project} /></td><td className="amount">{records.length ? money(records.reduce((sum, row) => sum + row.amountCents, 0)) : '—'}</td><td className="table-date">{project.updatedAt ? dateLabel(project.updatedAt) : 'Sin datos'}</td><td><Link href={href(`/proyectos/${project.id}`)} className="icon-button" aria-label={`Abrir ${project.name}`}><ArrowUpRight size={17} /></Link></td></tr>; })}</tbody></table></div>;
}

export function DashboardView(props: Props) {
  const { data, analytics, href, onUpload } = props;

  const activeProjects = data.projects.filter(
    project => project.status !== 'planned',
  ).length;

  const attention = data.alerts.filter(
    alert => alert.severity !== 'info',
  ).length;

  const topRegion = analytics.regions[0];

  const hasData = analytics.current.length > 0;

  return (
    <>
      <section className="overview-hero">
        <div className="overview-hero-main">
          <div className="overview-live">
            <span className="overview-live-dot" />
            <span>
              Corte al {dateLabel(data.asOf)}
            </span>
          </div>

          <div className="overview-hero-copy">
            <p>OPERACIÓN COMERCIAL</p>

            <h2>
              {hasData ? (
                <>
                  Tus ventas del periodo son
                  <strong>{money(analytics.total)}</strong>
                </>
              ) : (
                <>
                  Tu operación empieza
                  <strong>con una buena fuente.</strong>
                </>
              )}
            </h2>

            <span>
              {hasData
                ? analytics.change !== null
                  ? `${Math.abs(analytics.change).toFixed(1)}% ${
                      analytics.change >= 0 ? 'arriba' : 'abajo'
                    } frente al periodo anterior.`
                  : `${number(analytics.current.length)} movimientos registrados en este periodo.`
                : 'Carga un archivo para convertir tus datos en indicadores claros y accionables.'}
            </span>
          </div>

          <div className="overview-hero-actions">
            <button
              className="button primary"
              onClick={onUpload}
            >
              <Plus size={17} />
              Cargar archivo
            </button>

            <Link
              className="button overview-ghost-button"
              href={href('/reportes')}
            >
              <BarChart3 size={17} />
              Ver reportes
            </Link>
          </div>
        </div>

        <div className="overview-hero-stats">
          <div className="overview-mini-stat">
            <span className="overview-mini-icon">
              <FolderKanban size={18} />
            </span>

            <div>
              <small>PROYECTOS</small>
              <strong>{activeProjects}</strong>
              <span>activos</span>
            </div>
          </div>

          <div className="overview-mini-stat">
            <span className={`overview-mini-icon ${attention ? 'attention' : 'success'}`}>
              {attention ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </span>

            <div>
              <small>ATENCIÓN</small>
              <strong>{attention}</strong>
              <span>
                {attention === 1
                  ? 'pendiente'
                  : 'pendientes'}
              </span>
            </div>
          </div>

          <div className="overview-mini-stat">
            <span className="overview-mini-icon region">
              <TrendingUp size={18} />
            </span>

            <div>
              <small>ZONA PRINCIPAL</small>
              <strong className="overview-region-name">
                {topRegion?.name ?? '—'}
              </strong>
              <span>
                {topRegion
                  ? money(topRegion.amount)
                  : 'Sin movimientos'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="overview-mobile-actions">
        <Link href={href('/proyectos')}>
          <FolderKanban size={18} />
          <span>
            <strong>Proyectos</strong>
            <small>Ver procesos</small>
          </span>
          <ArrowRight size={15} />
        </Link>

        <Link href={href('/fuentes')}>
          <Database size={18} />
          <span>
            <strong>Fuentes</strong>
            <small>Revisar datos</small>
          </span>
          <ArrowRight size={15} />
        </Link>

        <Link href={href('/reportes')}>
          <BarChart3 size={18} />
          <span>
            <strong>Reportes</strong>
            <small>Analizar ventas</small>
          </span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <Metrics
        analytics={analytics}
        data={data}
      />

      {data.snapshot && (
        <div className="notice info overview-snapshot">
          <Database size={20} />

          <div>
            <strong>
              Consolidado: {money(data.snapshot.amountCents)}
            </strong>

            <p>
              Indicador al {dateLabel(data.snapshot.date, true)} ·{' '}
              {data.snapshot.weekly}
            </p>
          </div>
        </div>
      )}

      <div className="analytics-grid">
        <TrendPanel analytics={analytics} />
        <RegionsPanel analytics={analytics} />
      </div>

      <div className="operations-grid">
        <section className="panel projects-panel">
          <PanelTitle
            title="Proyectos recientes"
            subtitle="El estado actual de tus procesos."
          >
            <Link
              className="text-button"
              href={href('/proyectos')}
            >
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </PanelTitle>

          {data.projects.length ? (
            <ProjectsTable {...props} />
          ) : (
            <Empty
              title="Crea tu primer proyecto"
              message="Carga un archivo para comenzar a construir tu operación."
              action={
                <button
                  className="button secondary"
                  onClick={onUpload}
                >
                  Cargar archivo
                </button>
              }
            />
          )}
        </section>

        <section className={`focus-card ${attention ? 'has-alert' : 'is-clear'}`}>
          <div className="focus-label">
            <span>
              <Activity size={16} />
              PULSO
            </span>

            <span className="focus-live" />
          </div>

          <div className="focus-content">
            <span className="focus-status">
              {attention
                ? `${attention} ${
                    attention === 1
                      ? 'pendiente'
                      : 'pendientes'
                  }`
                : 'Todo en orden'}
            </span>

            <h2>
              {attention
                ? 'Hay algo que vale la pena revisar.'
                : 'Tu operación está al día.'}
            </h2>

            <p>
              {data.alerts.find(
                alert => alert.severity !== 'info',
              )?.message ??
                'Tus fuentes no muestran pendientes críticos. Mantén tus archivos actualizados para conservar esta visibilidad.'}
            </p>

            <Link
              href={href(
                attention
                  ? '/alertas'
                  : '/fuentes',
              )}
            >
              {attention
                ? 'Revisar pendientes'
                : 'Ver fuentes'}

              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div
            className="focus-decoration"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>
      </div>
    </>
  );
}
export function ProjectsView({ data, href, onUpload }: Props) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all');
  const projects = data.projects.filter(project => project.name.toLocaleLowerCase('es-MX').includes(query.toLocaleLowerCase('es-MX')) && (filter === 'all' || project.status === filter));
  return <><div className="list-toolbar"><div className="tabs" aria-label="Filtrar proyectos">{[['all', 'Todos'], ['ready', 'Al día'], ['attention', 'Por revisar']].map(([value, label]) => <button aria-pressed={filter === value} className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{label}{value === 'all' && <span>{data.projects.length}</span>}</button>)}</div><label className="search-input"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar proyecto…" aria-label="Buscar proyecto" /></label></div><div className="project-grid">{projects.map(project => <article className="panel project-card" key={project.id}><div className="project-card-top"><ProjectIcon project={project} /><Status project={project} /></div><h2>{project.name}</h2><p>{project.description}</p><div className="project-meta"><span><FileSpreadsheet size={15} />{project.source}</span><span><Users size={15} />{project.owner}</span></div><div className="project-card-footer"><span>{project.updatedAt ? `Datos al ${dateLabel(project.updatedAt)}` : 'Listo para definir'}</span><Link href={href(`/proyectos/${project.id}`)}>Ver proyecto <ArrowRight size={15} /></Link></div></article>)}<button className="new-project-card" onClick={onUpload}><span><Plus size={26} /></span><strong>Tu próximo proceso</strong><p>Empieza con un Excel.<br />Dale un espacio a sus indicadores.</p><small>Crear desde un archivo <ArrowUpRight size={14} /></small></button></div>{!projects.length && data.projects.length > 0 && <Empty title="Sin proyectos con ese filtro" message="Prueba con otro nombre o selecciona Todos." />}</>;
}

export function SourcesView({ data, href, onUpload }: Props) {
  return <><section className="source-hero"><div><span className="hero-tag"><FileSpreadsheet size={15} /> DEL EXCEL AL ANÁLISIS</span><h2>Tu información ya existe.<br /><span>Ahora dale una mejor forma.</span></h2><p>Carga el archivo de tu proceso, relaciona las columnas y revisa los datos. Para actualizarlo, vuelve a cargar el Excel en el mismo proyecto.</p><button className="button primary" onClick={onUpload}><Plus size={17} />Cargar archivo</button></div><div className="source-flow" aria-hidden="true"><div className="source-file"><FileSpreadsheet size={34} strokeWidth={1.3} /><strong>Tu archivo.xlsx</strong><span>EL PUNTO DE PARTIDA</span></div><div className="flow-line"><ArrowRight size={20} /></div><div className="source-chart"><div className="mini-chart"><i /><i /><i /><i /><i /></div><strong>Una nueva perspectiva</strong><span>DATOS QUE SE ENTIENDEN</span></div></div></section><section className="panel"><PanelTitle title="Fuentes de tus proyectos" subtitle="El origen de cada indicador, siempre visible."><span className="chip">{data.projects.filter(project => project.status !== 'planned').length} fuentes</span></PanelTitle><div className="source-list">{data.projects.filter(project => project.status !== 'planned').map(project => <article className="source-row" key={project.id}><ProjectIcon project={project} /><div className="source-row-info"><h3>{project.source}</h3><Link href={href(`/proyectos/${project.id}`)}>{project.name}</Link>{project.message && <p>{project.message}</p>}</div><Status project={project} /><button className="button secondary small" onClick={onUpload}>Revisar archivo <ArrowUpRight size={14} /></button></article>)}</div>{!data.projects.length && <Empty title="Aquí vivirán tus fuentes" message="Carga el primer archivo para crear un proyecto y analizar su información." />}</section><div className="source-notes"><article className="panel"><HardDrive size={23} /><h3>Hoy, desde tus archivos</h3><p>Las cargas se guardan en este navegador. Exporta tus registros para conservar una copia y vuelve a cargar un archivo para actualizar el proyecto.</p><span className="badge badge-ready"><i />Disponible</span></article><article className="panel"><Database size={23} /><h3>Mañana, desde tu base de datos</h3><p>La capa de fuentes está separada del análisis. El siguiente paso es conectar almacenamiento compartido y sincronización por proyecto.</p><span className="badge badge-planned"><i />Siguiente fase</span></article><article className="panel"><ShieldCheck size={23} /><h3>Una entrada confiable</h3><p>La validación comprueba columnas, fechas e importes. Los registros con errores deben corregirse antes de incorporar la carga.</p><span className="badge badge-ready"><i />Disponible</span></article></div></>;
}

function RecordsTable({ records, onExport }: { records: SalesRecord[]; onExport: Props['onExport'] }) {
  const [query, setQuery] = useState(''); const [page, setPage] = useState(0); const [sort, setSort] = useState<'newest' | 'largest'>('newest');
  const filtered = records.filter(row => `${row.id} ${row.client} ${row.region}`.toLocaleLowerCase('es-MX').includes(query.toLocaleLowerCase('es-MX'))).sort((a, b) => sort === 'largest' ? b.amountCents - a.amountCents : b.date.localeCompare(a.date));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)); const actualPage = Math.min(page, pages - 1); const visible = filtered.slice(actualPage * 10, actualPage * 10 + 10);
  return <section className="panel records-panel"><PanelTitle title="Detalle de movimientos" subtitle={`${number(filtered.length)} registros disponibles con estos filtros.`}><button className="button secondary small" disabled={!filtered.length} onClick={() => onExport(filtered)}><ArrowDownToLine size={15} />Exportar selección</button></PanelTitle><div className="table-tools"><label className="search-input"><Search size={16} /><input placeholder="Buscar cliente, zona o referencia…" aria-label="Buscar movimientos" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label><label className="sort-control">Ordenar<select aria-label="Ordenar movimientos" value={sort} onChange={event => { setSort(event.target.value as 'newest' | 'largest'); setPage(0); }}><option value="newest">Más recientes</option><option value="largest">Mayor importe</option></select></label></div><div className="table-scroll"><table><thead><tr><th>REFERENCIA</th><th>CLIENTE</th><th>ZONA</th><th>FECHA</th><th className="text-right">IMPORTE</th></tr></thead><tbody>{visible.map(row => <tr key={`${row.projectId}-${row.id}`}><td className="record-id">{row.id}</td><td className="client-cell"><span>{row.client.slice(0, 2).toUpperCase()}</span><strong>{row.client}</strong></td><td>{row.region}</td><td>{dateLabel(row.date)}</td><td className="text-right amount">{money(row.amountCents)}</td></tr>)}</tbody></table></div>{!visible.length && <Empty title="No hay movimientos para mostrar" message={query ? 'Prueba con otra búsqueda o cambia los filtros.' : 'Carga un archivo o selecciona otro periodo.'} />}<div className="pagination"><span>{filtered.length ? `${actualPage * 10 + 1}–${Math.min((actualPage + 1) * 10, filtered.length)} de ${number(filtered.length)} movimientos` : '0 movimientos'}</span><div><button className="icon-button" disabled={!actualPage} onClick={() => setPage(actualPage - 1)} aria-label="Página anterior"><ChevronLeft size={17} /></button><span>{actualPage + 1} / {pages}</span><button className="icon-button" disabled={actualPage >= pages - 1} onClick={() => setPage(actualPage + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button></div></div></section>;
}

export function ReportsView(props: Props) { return <><Metrics {...props} /><RecordsTable key={`${props.analytics.start}-${props.analytics.current[0]?.projectId}-${props.analytics.current.length}`} records={props.analytics.current} onExport={props.onExport} /><div className="notice info"><Info size={19} /><p>Los importes corresponden a cada fila del archivo. La comparación usa un periodo anterior de la misma duración. Un archivo con detalle por producto requiere definir la agrupación por factura en su módulo.</p></div></>; }

export function AlertsView({ data, href }: Props) {
  const [filter, setFilter] = useState('all'); const alerts = data.alerts.filter(alert => filter === 'all' || (filter === 'action' ? alert.severity !== 'info' : alert.severity === 'info'));
  return <><div className="alert-summary"><div><span className="summary-icon warning"><AlertCircle size={24} /></span><strong>{data.alerts.filter(alert => alert.severity !== 'info').length}</strong><span>Requieren atención</span></div><div><span className="summary-icon info"><Info size={24} /></span><strong>{data.alerts.filter(alert => alert.severity === 'info').length}</strong><span>Informativas</span></div><div><span className="summary-icon success"><CheckCircle2 size={24} /></span><strong>{data.projects.filter(project => project.status === 'ready').length}</strong><span>Proyectos al día</span></div></div><div className="tabs" aria-label="Filtrar alertas">{[['all', 'Todas'], ['action', 'Requieren atención'], ['info', 'Informativas']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="alerts-list">{alerts.map(alert => <article className="panel alert-card" key={alert.id}><span className={`alert-icon ${alert.severity}`}>{alert.severity === 'info' ? <Info size={22} /> : <AlertCircle size={22} />}</span><div><div className="alert-meta"><span>{data.projects.find(project => project.id === alert.projectId)?.name}</span><span>{alert.severity === 'info' ? 'Información' : 'Por revisar'}</span></div><h2>{alert.title}</h2><p>{alert.message}</p><Link href={href(alert.severity === 'info' ? `/proyectos/${alert.projectId}` : '/fuentes')} className="text-button">{alert.severity === 'info' ? 'Ver proyecto' : 'Revisar fuente'}<ArrowRight size={15} /></Link></div></article>)}</div>{!alerts.length && <section className="panel"><Empty title="Todo está en orden por aquí" message="No hay alertas que coincidan con esta vista. Las reglas automáticas por umbral se incorporarán en una siguiente fase." /></section>}<p className="quiet-note">{data.mode === 'demo' ? 'Estas alertas son ejemplos de la demostración.' : 'Aquí se muestran problemas detectados en las fuentes. No se envían correos al abrir esta vista.'}</p></>;
}

export function DetailView(props: Props & { project: Project }) {
  const { project, data, analytics, href, onUpload, onExport } = props;
  if (project.status === 'planned') return <section className="panel"><Empty title="Un nuevo proceso, bien planeado" message="Este espacio está reservado para inventario. Primero se definirán el archivo de origen, sus columnas y las reglas de sus indicadores." action={<Link className="button secondary" href={href('/configuracion')}>Ver próximos pasos <ArrowRight size={15} /></Link>} /></section>;
  return <><div className="detail-summary"><div><ProjectIcon project={project} /><span><strong>{project.source}</strong><small>{project.owner}</small></span></div><Status project={project} /><Link className="text-button" href={href('/fuentes')}>Ver fuente <ArrowUpRight size={15} /></Link></div>{project.message && <div className="notice warning"><AlertCircle size={19} /><p>{project.message}</p></div>}<Metrics data={data} analytics={analytics} />{!analytics.current.length && <section className="panel"><Empty title="Tu proyecto está esperando información" message="Carga un Excel para empezar a explorar sus indicadores." action={<button className="button primary" onClick={onUpload}><Plus size={16} />Cargar archivo</button>} /></section>}<TrendPanel analytics={analytics} /><RecordsTable records={analytics.current} onExport={onExport} /></>;
}

export function SettingsView({ data, theme, onTheme, onMode }: { data: WorkspaceData; theme: string; onTheme: (theme: string) => void; onMode: () => void }) {
  return <div className="settings-grid"><section className="panel settings-card"><PanelTitle title="Apariencia" subtitle="Elige cómo quieres ver tu espacio." /><div className="theme-options">{[{ id: 'light', label: 'Claro', icon: Sun }, { id: 'dark', label: 'Oscuro', icon: Moon }].map(option => <button key={option.id} className={theme === option.id ? 'selected' : ''} aria-pressed={theme === option.id} onClick={() => onTheme(option.id)}><span className={`theme-preview preview-${option.id}`}><i /><b /><b /><b /></span><span><option.icon size={16} />{option.label}{theme === option.id && <Check size={16} />}</span></button>)}</div></section><section className="panel settings-card"><PanelTitle title="Tu información" subtitle="Un origen claro para cada dato." /><div className="setting-row"><span><HardDrive size={21} /></span><div><strong>{data.mode === 'demo' ? 'Demostración' : data.mode === 'local' ? 'Archivos en este navegador' : 'Conexiones del servidor'}</strong><p>{data.mode === 'local' ? 'Las cargas permanecen en este dispositivo. No se comparten con otros usuarios. Exporta tus registros antes de borrar los datos del navegador.' : data.mode === 'demo' ? 'Datos sintéticos para recorrer la plataforma. Tus archivos se guardan en un espacio separado.' : 'Lectura de Excel y del indicador Supabase configurados en el servidor.'}</p></div></div><button className="button secondary" onClick={onMode}>{data.mode === 'demo' ? 'Abrir mis archivos' : 'Explorar demostración'}<ArrowRight size={15} /></button><Link className="text-button source-connection-link" href="/fuentes?modo=real">Ver conexiones del servidor <ArrowUpRight size={15} /></Link></section><section className="panel roadmap-card"><PanelTitle title="La plataforma crece con tu operación" subtitle="Una ruta concreta para los siguientes requerimientos." /><div className="roadmap">{[{ step: '01', title: 'Excel → proyecto → indicadores', text: 'Carga y validación local, relación de columnas, filtros, análisis y exportación.', ready: true, icon: FileSpreadsheet }, { step: '02', title: 'Trabajo en equipo', text: 'Acceso con usuarios, permisos por proyecto y almacenamiento central de archivos.', icon: Users }, { step: '03', title: 'Procesos a tu medida', text: 'Plantillas y reglas independientes para inventario, pedidos, cobranza y otros procesos.', icon: FolderKanban }, { step: '04', title: 'Datos siempre actualizados', text: 'Conectores de base de datos, historial de cargas, sincronización y alertas automáticas.', icon: Database }].map(step => <div className="roadmap-step" key={step.step}><span className={step.ready ? 'step-complete' : ''}>{step.ready ? <Check size={18} /> : step.step}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><span className={`badge ${step.ready ? 'badge-ready' : 'badge-planned'}`}>{step.ready ? 'Disponible' : 'Siguiente fase'}</span></div>)}</div></section><div className="notice info settings-note"><ShieldCheck size={20} /><p>El acceso con usuarios y los permisos por proyecto deben implementarse y validarse antes de habilitar una operación compartida con datos privados.</p></div></div>;
}
