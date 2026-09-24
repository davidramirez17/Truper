'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { Brand } from '@/components/ui/Brand';
import { ProjectDialog } from '../platform/ProjectDialog';
import { UsersView, HistoryView, ActivityView, DesignView } from '../platform/PlatformViews';
import { canCreateProjects, roleLabels } from '../auth/types';
import { ArrowDownToLine, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Command, Database, FileSpreadsheet, Menu, Moon, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Sun, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { MobileDock } from '@/components/MobileDock';
import { UploadDialog, downloadText } from '../sources/UploadDialog';
import { csvText, dateLabel, selectAnalytics } from '../analytics/selectors';
import type { Period, WorkspaceData, WorkspaceView } from '../analytics/types';
import { navigation, adminNavigation, pageInfo, settingsNav } from './navigation';
import { AlertsView, DashboardView, DetailView, ProjectsView, ReportsView, SettingsView, SourcesView } from './views';

export function Workspace({ data, view, projectId }: { data: WorkspaceData; view: WorkspaceView; projectId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState<'search' | 'upload' | 'guide' | 'project' | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const { resolvedTheme: theme, setTheme } = useTheme();
  const profile = data.profile!;
  const initials = (profile.full_name || profile.email).split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const visibleNavigation = [...navigation, ...adminNavigation.filter(item => item.view !== 'users' || profile.role === 'superadmin')];
  const canCreate = canCreateProjects(profile.role);
  const canUpload = data.projects.some(project => project.canEdit);
  function openUpload() { if (canUpload) setDialog('upload'); else if (canCreate) setDialog('project'); else setToast('Necesitas permiso de carga en un proyecto. Solicítalo al superusuario.'); }
  const [refreshCount, setRefreshCount] = useState(0);
  const periodParam = Number(params.get('periodo'));
  const period: Period = periodParam === 7 || periodParam === 14 ? periodParam : 30;
  const requestedProject = params.get('proyecto') ?? 'all';
  const selectedProject = projectId ?? (data.projects.some(project => project.id === requestedProject) ? requestedProject : 'all');
  const analytics = selectAnalytics(data.records, data.asOf, period, selectedProject);
  const currentProject = data.projects.find(project => project.id === projectId);
  const info = currentProject ? { ...pageInfo.detail, title: currentProject.name, description: currentProject.description } : pageInfo[view];
  const attention = data.alerts.filter(alert => alert.severity !== 'info').length;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) { if ((event.ctrlKey || event.metaKey) && event.key === 'k') { event.preventDefault(); setDialog(value => value === 'search' ? null : 'search'); } }
    document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey);
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { if (refreshCount && !pending) setToast('Vista actualizada con la información disponible.'); }, [pending, refreshCount]);

  function href(path: string) {
    const query = new URLSearchParams();
    if (period !== 30) query.set('periodo', String(period));
    return `${path}${query.size ? `?${query}` : ''}`;
  }
  function updateFilter(key: string, value: string) {
    const query = new URLSearchParams(params); query.set(key, value);
    startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));
  }
  function changeTheme(value: string) { setTheme(value); }
  function exportRecords(records = analytics.current) {
    if (!records.length) { setToast('No hay movimientos para exportar con estos filtros.'); return; }
    downloadText(csvText(records), `ventas-${data.asOf}.csv`);
    setToast(`${records.length} movimientos preparados para descargar.`);
  }
  const navigationContent = <>
    <Link href={href('/')} className="brand" aria-label="Truper, ir al resumen"><Brand compact /></Link>
    <div className="workspace-switch"><span className="workspace-avatar">TC</span><div><strong>Equipo comercial</strong><span>Plataforma de ventas</span></div><span className="workspace-dot" /></div>
    <p className="nav-group-label">ESPACIO DE TRABAJO</p>
    <nav aria-label="Navegación principal">{visibleNavigation.map(item => <Link href={href(item.href)} key={item.view} onClick={() => setMobileOpen(false)} aria-current={view === item.view || (view === 'detail' && item.view === 'projects') ? 'page' : undefined} className="nav-item"><item.icon size={19} strokeWidth={1.7} /><span>{item.label}</span>{item.view === 'alerts' && attention > 0 && <span className="nav-count">{attention}</span>}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-note"><span className="small-orbit"><Sparkles size={19} /></span><strong>Una base para ir más lejos.</strong><p>Conecta tus procesos.<br />Multiplica tus posibilidades.</p><button onClick={() => { setMobileOpen(false); setDialog('guide'); }}>Conoce el camino <ArrowUpRight size={15} /></button></div>
      <Link href={href('/configuracion')} onClick={() => setMobileOpen(false)} className="nav-item" aria-current={view === 'settings' ? 'page' : undefined}><settingsNav.icon size={19} strokeWidth={1.7} /><span>Configuración</span></Link>
      <button className="nav-item help-nav" onClick={() => { setMobileOpen(false); setDialog('guide'); }}><CircleHelp size={19} strokeWidth={1.7} /><span>Guía de la plataforma</span><ArrowUpRight size={15} /></button>
      <div className="sidebar-profile"><span className="profile-avatar">{initials}</span><div><strong>{profile.full_name || profile.email}</strong><small>{roleLabels[profile.role]}</small></div><span className="online-dot" /></div>
    </div>
  </>;
  const viewProps = { data, analytics, href, onUpload: openUpload, onCreate: () => setDialog('project'), onExport: exportRecords };
  const searchResults = [ ...visibleNavigation.map(item => ({ label: item.label, href: item.href, kind: 'Sección' })), ...data.projects.map(project => ({ label: project.name, href: `/proyectos/${project.id}`, kind: 'Proyecto' })) ].filter(item => item.label.toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(search.toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Saltar al contenido</a>
    <aside className="sidebar">{navigationContent}</aside>
    {mobileOpen && <Dialog title="Tu espacio de trabajo" onClose={() => setMobileOpen(false)}><div className="mobile-navigation">{navigationContent}</div></Dialog>}
    <div className="workspace-main">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="breadcrumb-home">Espacio de trabajo</span><ChevronRight size={13} className="breadcrumb-home" /><span>{view === 'detail' ? 'Proyectos' : visibleNavigation.find(item => item.view === view)?.label ?? 'Configuración'}</span></div><div className="topbar-actions"><button className="global-search" onClick={() => { setSearch(''); setDialog('search'); }}><Search size={16} /><span>Buscar en tu espacio</span><kbd><Command size={11} /> K</kbd></button><span className="topbar-divider" /><button className="icon-button theme-toggle" aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'} onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button><Link href={href('/alertas')} className="icon-button notification-button" aria-label={`Centro de alertas, ${attention} pendientes`}><Bell size={19} />{attention > 0 && <i />}</Link><Link href={href('/configuracion')} className="topbar-avatar" aria-label="Configuración de mi cuenta">{initials}</Link></div></header>
      <main id="main-content" className="content" aria-busy={pending}>
        {data.connectionError ? <div className="notice error" role="alert"><Database size={19} /><p>{data.connectionError}</p><button className="text-button" onClick={() => router.refresh()}>Reintentar</button></div> : <div className="workspace-context"><span><ShieldCheck size={14} />{roleLabels[profile.role]}</span><span><i />Datos de tus proyectos · acceso verificado</span></div>}
        {view === 'detail' && <Link href={href('/proyectos')} className="back-link">← Todos los proyectos</Link>}
        <div className={`page-heading page-heading-${view}`}><div><p className="eyebrow">{info.eyebrow}</p><h1>{info.title}</h1><p className="page-description">{info.description}</p></div><div className="heading-actions">{view === 'projects' && canCreate && <button className="button secondary" onClick={() => setDialog('project')}><Plus size={17} />Nuevo proyecto</button>}{['overview', 'reports', 'detail'].includes(view) && <button className="button secondary" onClick={() => exportRecords()} disabled={!analytics.current.length}><ArrowDownToLine size={16} /><span>Exportar</span></button>}<button className="button primary" onClick={openUpload}><Plus size={18} />Cargar archivo</button></div></div>
        {['overview', 'reports', 'detail'].includes(view) && <section className="filter-bar" aria-label="Filtros del análisis"><div className="filter-controls">{view !== 'detail' && <label className="select-control"><Database size={15} /><span className="sr-only">Proyecto</span><select value={selectedProject} onChange={event => updateFilter('proyecto', event.target.value)}><option value="all">Todos los proyectos</option>{data.projects.filter(project => project.status !== 'planned').map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown size={14} /></label>}<label className="select-control"><CalendarDays size={16} /><span className="sr-only">Periodo</span><select value={period} onChange={event => updateFilter('periodo', event.target.value)}><option value={7}>Últimos 7 días</option><option value={14}>Últimos 14 días</option><option value={30}>Últimos 30 días</option></select><ChevronDown size={14} /></label><span className="date-range">{dateLabel(analytics.start)} – {dateLabel(data.asOf)}, {data.asOf.slice(0, 4)}</span></div><div className="refresh-control"><span className="status-dot" /><span>Corte: {dateLabel(data.asOf)}</span><button className="icon-button" disabled={pending} aria-label="Actualizar información" onClick={() => { setRefreshCount(value => value + 1); startTransition(() => router.refresh()); }}><RefreshCw size={15} className={pending ? 'spin' : ''} /></button></div></section>}
        <div className={pending ? 'view-content view-pending' : 'view-content'}>
          {view === 'overview' && <DashboardView {...viewProps} />}
          {view === 'projects' && <ProjectsView {...viewProps} />}
          {view === 'sources' && <SourcesView {...viewProps} />}
          {view === 'reports' && <ReportsView {...viewProps} />}
          {view === 'alerts' && <AlertsView {...viewProps} />}
          {view === 'settings' && <SettingsView data={data} theme={theme ?? 'light'} onTheme={changeTheme} />}
          {view === 'users' && profile.role === 'superadmin' && <UsersView data={data} />}
          {view === 'history' && <HistoryView data={data} />}
          {view === 'activity' && <ActivityView data={data} />}
          {view === 'design' && <DesignView />}
          {view === 'detail' && currentProject && <DetailView {...viewProps} project={currentProject} />}
        </div>
        <footer className="page-footer"><span><span className="footer-mark">T</span> Información clara. Decisiones que avanzan.</span><span>Datos de tus proyectos · MXN<i />Truper Workspace</span></footer>
      </main>
    </div>
    {dialog === 'project' && canCreate && <ProjectDialog onClose={() => setDialog(null)} />}
    {dialog === 'upload' && <UploadDialog projects={data.projects.filter(project => project.canEdit)} defaultProjectId={projectId} onClose={() => setDialog(null)} onImported={id => { setDialog(null); setToast('Archivo guardado. Los indicadores ya usan la nueva carga.'); router.push(`/proyectos/${id}`); router.refresh(); }} />}
    {dialog === 'search' && <Dialog title="Buscar en tu espacio" onClose={() => setDialog(null)}><div className="dialog-body"><label className="search-input command-input"><Search size={19} /><input autoFocus placeholder="Busca una sección o proyecto…" value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar secciones o proyectos" /></label><div className="command-results">{searchResults.map(item => <Link key={item.href} href={href(item.href)} onClick={() => setDialog(null)}><span><small>{item.kind}</small><strong>{item.label}</strong></span><ArrowUpRight size={18} /></Link>)}{!searchResults.length && <p className="empty-inline">No encontramos resultados para “{search}”. Prueba con otro nombre.</p>}</div></div></Dialog>}
    {dialog === 'guide' && <Dialog title="De tus archivos a una operación conectada" onClose={() => setDialog(null)}><div className="dialog-body guide"><p className="muted">Cada proceso tiene su lugar. Esta es la ruta para construir tu plataforma.</p>{[{ icon: FileSpreadsheet, title: '01 · Revisa tus fuentes', text: 'Valida un Excel o CSV y corrige las columnas antes de incorporarlo.' }, { icon: Database, title: '02 · Conecta cada proyecto', text: 'Crea un proyecto y guarda los registros validados. Cada nueva carga sustituye la vista activa y conserva el historial.' }, { icon: ShieldCheck, title: '03 · Trabaja con acceso seguro', text: 'El superusuario aprueba cuentas y asigna accesos. Cada consulta respeta los permisos de la base de datos.' }, { icon: Sparkles, title: '04 · Automatiza con confianza', text: 'Después: sincronización programada, metas y alertas basadas en reglas de negocio.' }].map(step => <div className="guide-step" key={step.title}><span><step.icon size={21} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}<div className="notice info"><p>Tus proyectos usan datos cargados por tu equipo. Los próximos procesos compartirán estos componentes y definirán sus propias reglas de análisis.</p></div></div></Dialog>}
    <MobileDock
      view={view}
      href={href}
      attention={attention}
      onUpload={openUpload}
    />
    {toast && <div className="toast" role="status"><Check size={18} /><span>{toast}</span><button aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}
