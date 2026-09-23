'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Command, Database, FileSpreadsheet, Menu, Moon, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Sun, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { UploadDialog, downloadText } from '../sources/UploadDialog';
import { csvText, dateLabel, selectAnalytics } from '../analytics/selectors';
import type { Period, WorkspaceData, WorkspaceView } from '../analytics/types';
import { navigation, pageInfo, settingsNav } from './navigation';
import { AlertsView, DashboardView, DetailView, ProjectsView, ReportsView, SettingsView, SourcesView } from './views';

export function Workspace({ data, view, projectId }: { data: WorkspaceData; view: WorkspaceView; projectId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState<'search' | 'upload' | 'guide' | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState('light');
  const [refreshCount, setRefreshCount] = useState(0);
  const periodParam = Number(params.get('periodo'));
  const period: Period = periodParam === 7 || periodParam === 14 ? periodParam : 30;
  const requestedProject = params.get('proyecto') ?? 'all';
  const selectedProject = projectId ?? (data.projects.some(project => project.id === requestedProject) ? requestedProject : 'all');
  const analytics = selectAnalytics(data.records, data.asOf, period, selectedProject);
  const currentProject = data.projects.find(project => project.id === projectId);
  const info = currentProject ? { ...pageInfo.detail, title: currentProject.name, description: currentProject.description } : pageInfo[view];
  const attention = data.alerts.filter(alert => alert.severity !== 'info').length;

  useEffect(() => { setTheme(document.documentElement.dataset.theme ?? 'light'); }, []);
  useEffect(() => {
    function handleKey(event: KeyboardEvent) { if ((event.ctrlKey || event.metaKey) && event.key === 'k') { event.preventDefault(); setDialog(value => value === 'search' ? null : 'search'); } }
    document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey);
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { if (refreshCount && !pending) setToast('Vista actualizada con la información disponible.'); }, [pending, refreshCount]);

  function href(path: string) {
    const query = new URLSearchParams();
    if (data.mode === 'real') query.set('modo', 'real');
    if (period !== 30) query.set('periodo', String(period));
    return `${path}${query.size ? `?${query}` : ''}`;
  }
  function updateFilter(key: string, value: string) {
    const query = new URLSearchParams(params); query.set(key, value);
    startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));
  }
  function switchMode() {
    const query = new URLSearchParams(params); query.set('modo', data.mode === 'demo' ? 'real' : 'demo'); query.delete('proyecto');
    startTransition(() => router.push(`${view === 'detail' ? '/proyectos' : pathname}?${query}`));
  }
  function changeTheme(value: string) {
    setTheme(value); document.documentElement.dataset.theme = value;
    try { localStorage.setItem('truper-theme', value); } catch { /* Storage can be unavailable in private contexts. */ }
  }
  function exportRecords(records = analytics.current) {
    if (!records.length) { setToast('No hay movimientos para exportar con estos filtros.'); return; }
    downloadText(csvText(records), `${data.mode === 'demo' ? 'DEMO-' : ''}ventas-${data.asOf}.csv`);
    setToast(`${records.length} movimientos preparados para descargar.`);
  }
  const navigationContent = <>
    <Link href={href('/')} className="brand" aria-label="Truper, ir al resumen"><span className="brand-mark">T<span /></span><span><b>TRUPER<span className="brand-period">.</span></b><small>INTELIGENCIA COMERCIAL</small></span></Link>
    <div className="workspace-switch"><span className="workspace-avatar">TC</span><div><strong>Equipo comercial</strong><span>Plataforma de ventas</span></div><span className="workspace-dot" /></div>
    <p className="nav-group-label">ESPACIO DE TRABAJO</p>
    <nav aria-label="Navegación principal">{navigation.map(item => <Link href={href(item.href)} key={item.view} onClick={() => setMobileOpen(false)} aria-current={view === item.view || (view === 'detail' && item.view === 'projects') ? 'page' : undefined} className="nav-item"><item.icon size={19} strokeWidth={1.7} /><span>{item.label}</span>{item.view === 'alerts' && attention > 0 && <span className="nav-count">{attention}</span>}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-note"><span className="small-orbit"><Sparkles size={19} /></span><strong>Una base para ir más lejos.</strong><p>Conecta tus procesos.<br />Multiplica tus posibilidades.</p><button onClick={() => { setMobileOpen(false); setDialog('guide'); }}>Conoce el camino <ArrowUpRight size={15} /></button></div>
      <Link href={href('/configuracion')} onClick={() => setMobileOpen(false)} className="nav-item" aria-current={view === 'settings' ? 'page' : undefined}><settingsNav.icon size={19} strokeWidth={1.7} /><span>Configuración</span></Link>
      <button className="nav-item help-nav" onClick={() => { setMobileOpen(false); setDialog('guide'); }}><CircleHelp size={19} strokeWidth={1.7} /><span>Guía de la plataforma</span><ArrowUpRight size={15} /></button>
      <div className="sidebar-profile"><span className="profile-avatar">EC</span><div><strong>Equipo comercial</strong><small>{data.mode === 'demo' ? 'Explorando la demostración' : 'Vista de fuentes conectadas'}</small></div><span className="online-dot" /></div>
    </div>
  </>;
  const viewProps = { data, analytics, href, onUpload: () => setDialog('upload'), onExport: exportRecords };
  const searchResults = [ ...navigation.map(item => ({ label: item.label, href: item.href, kind: 'Sección' })), ...data.projects.map(project => ({ label: project.name, href: `/proyectos/${project.id}`, kind: 'Proyecto' })) ].filter(item => item.label.toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(search.toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Saltar al contenido</a>
    <aside className="sidebar">{navigationContent}</aside>
    {mobileOpen && <Dialog title="Tu espacio de trabajo" onClose={() => setMobileOpen(false)}><div className="mobile-navigation">{navigationContent}</div></Dialog>}
    <div className="workspace-main">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="breadcrumb-home">Espacio de trabajo</span><ChevronRight size={13} className="breadcrumb-home" /><span>{view === 'detail' ? 'Proyectos' : navigation.find(item => item.view === view)?.label ?? 'Configuración'}</span></div><div className="topbar-actions"><button className="global-search" onClick={() => { setSearch(''); setDialog('search'); }}><Search size={16} /><span>Buscar en tu espacio</span><kbd><Command size={11} /> K</kbd></button><span className="topbar-divider" /><button className="icon-button theme-toggle" aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'} onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button><Link href={href('/alertas')} className="icon-button notification-button" aria-label={`Centro de alertas, ${attention} pendientes`}><Bell size={19} />{attention > 0 && <i />}</Link><Link href={href('/configuracion')} className="topbar-avatar" aria-label="Configuración del espacio">EC</Link></div></header>
      <main id="main-content" className="content" aria-busy={pending}>
        <div className={`mode-banner ${data.mode === 'real' ? 'mode-real' : ''}`}><span>{data.mode === 'demo' ? <Sparkles size={15} /> : <Database size={15} />}<strong>{data.mode === 'demo' ? 'Espacio de demostración' : 'Tus fuentes reales'}</strong><span className="mode-description">{data.mode === 'demo' ? 'Explora la plataforma con datos de ejemplo.' : 'Información disponible en tus conexiones configuradas.'}</span></span><button onClick={switchMode} disabled={pending}>{data.mode === 'demo' ? 'Ver mis datos' : 'Explorar demo'}<ArrowRight size={14} /></button></div>
        {view === 'detail' && <Link href={href('/proyectos')} className="back-link">← Todos los proyectos</Link>}
        <div className="page-heading"><div><p className="eyebrow">{info.eyebrow}</p><h1>{info.title}</h1><p className="page-description">{info.description}</p></div><div className="heading-actions">{['overview', 'reports', 'detail'].includes(view) && <button className="button secondary" onClick={() => exportRecords()} disabled={!analytics.current.length}><ArrowDownToLine size={16} /><span>Exportar</span></button>}<button className="button primary" onClick={() => setDialog('upload')}><Plus size={18} />Validar archivo</button></div></div>
        {['overview', 'reports', 'detail'].includes(view) && <section className="filter-bar" aria-label="Filtros del análisis"><div className="filter-controls">{view !== 'detail' && <label className="select-control"><Database size={15} /><span className="sr-only">Proyecto</span><select value={selectedProject} onChange={event => updateFilter('proyecto', event.target.value)}><option value="all">Todos los proyectos</option>{data.projects.filter(project => project.status !== 'planned').map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown size={14} /></label>}<label className="select-control"><CalendarDays size={16} /><span className="sr-only">Periodo</span><select value={period} onChange={event => updateFilter('periodo', event.target.value)}><option value={7}>Últimos 7 días</option><option value={14}>Últimos 14 días</option><option value={30}>Últimos 30 días</option></select><ChevronDown size={14} /></label><span className="date-range">{dateLabel(analytics.start)} – {dateLabel(data.asOf)}, {data.asOf.slice(0, 4)}</span></div><div className="refresh-control"><span className="status-dot" /><span>Corte: {dateLabel(data.asOf)}</span><button className="icon-button" disabled={pending} aria-label="Actualizar información" onClick={() => { setRefreshCount(value => value + 1); startTransition(() => router.refresh()); }}><RefreshCw size={15} className={pending ? 'spin' : ''} /></button></div></section>}
        <div className={pending ? 'view-content view-pending' : 'view-content'}>
          {view === 'overview' && <DashboardView {...viewProps} />}
          {view === 'projects' && <ProjectsView {...viewProps} />}
          {view === 'sources' && <SourcesView {...viewProps} />}
          {view === 'reports' && <ReportsView {...viewProps} />}
          {view === 'alerts' && <AlertsView {...viewProps} />}
          {view === 'settings' && <SettingsView data={data} theme={theme} onTheme={changeTheme} onMode={switchMode} />}
          {view === 'detail' && currentProject && <DetailView {...viewProps} project={currentProject} />}
        </div>
        <footer className="page-footer"><span><span className="footer-mark">T</span> Información clara. Decisiones que avanzan.</span><span>{data.mode === 'demo' ? 'Datos de ejemplo · MXN' : 'Lectura de fuentes · MXN'}<i />Truper Workspace</span></footer>
      </main>
    </div>
    {dialog === 'upload' && <UploadDialog onClose={() => setDialog(null)} />}
    {dialog === 'search' && <Dialog title="Buscar en tu espacio" onClose={() => setDialog(null)}><div className="dialog-body"><label className="search-input command-input"><Search size={19} /><input autoFocus placeholder="Busca una sección o proyecto…" value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar secciones o proyectos" /></label><div className="command-results">{searchResults.map(item => <Link key={item.href} href={href(item.href)} onClick={() => setDialog(null)}><span><small>{item.kind}</small><strong>{item.label}</strong></span><ArrowUpRight size={18} /></Link>)}{!searchResults.length && <p className="empty-inline">No encontramos resultados para “{search}”. Prueba con otro nombre.</p>}</div></div></Dialog>}
    {dialog === 'guide' && <Dialog title="De tus archivos a una operación conectada" onClose={() => setDialog(null)}><div className="dialog-body guide"><p className="muted">Cada proceso tiene su lugar. Esta es la ruta para construir tu plataforma.</p>{[{ icon: FileSpreadsheet, title: '01 · Revisa tus fuentes', text: 'Valida un Excel o CSV y corrige las columnas antes de incorporarlo.' }, { icon: Database, title: '02 · Conecta cada proyecto', text: 'La siguiente fase incorpora almacenamiento, historial de cargas y permisos por proyecto.' }, { icon: ShieldCheck, title: '03 · Trabaja con acceso seguro', text: 'Autenticación, roles y políticas de acceso deben quedar verificados antes de abrir la operación a usuarios.' }, { icon: Sparkles, title: '04 · Automatiza con confianza', text: 'Después: sincronización programada, metas y alertas basadas en reglas de negocio.' }].map(step => <div className="guide-step" key={step.title}><span><step.icon size={21} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}<div className="notice info"><p>La demostración permite explorar el frontend. Los datos reales requieren fuentes configuradas; el acceso por usuario y la carga persistente todavía están pendientes.</p></div></div></Dialog>}
    {toast && <div className="toast" role="status"><Check size={18} /><span>{toast}</span><button aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}
