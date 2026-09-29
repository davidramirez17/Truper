'use client';

import Link from 'next/link';
import { useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Building2, Camera, Check, CheckCircle2, Clock3, FileSpreadsheet, Filter, GitBranch, History, ImagePlus, Layers3, LayoutList, LoaderCircle, LockKeyhole, Search, ShieldCheck, Users, Wallet } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog } from '@/components/ui/Dialog';
import { MetricCard } from '@/components/ui/MetricCard';
import { PdfButton } from '@/components/ui/PdfButton';
import type { WorkspaceData } from '../analytics/types';
import { number } from '../analytics/selectors';
import { permissionLabels, roleDescriptions, roleLabels, type Profile, type ProfileStatus, type Role } from '../auth/types';
import { assignMember, manageUser, updateMyProfile, updateUserProfile } from './actions';
import { moduleRegistry } from '../registry';

const timestamp = (value: string) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date(value));
const statusLabels: Record<ProfileStatus, string> = { active: 'Activo', pending: 'Pendiente', suspended: 'Suspendido' };
const statusClasses: Record<ProfileStatus, string> = { active: 'badge-ready', pending: 'badge-attention', suspended: 'badge-planned' };
type MemberPermission = 'viewer' | 'editor' | 'none';

async function uploadAvatarFile(file: File, userId: string) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Usa una imagen JPG, PNG o WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('La foto debe pesar menos de 5 MB.');
  const client = createSupabaseBrowser();
  const path = `${userId}/avatar`;
  const { error } = await client.storage.from('truper-avatars').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
  if (error) throw new Error('No se pudo subir la foto. Verifica que la migración de avatares esté aplicada.');
  const { data } = client.storage.from('truper-avatars').getPublicUrl(path);
  return `${data.publicUrl}${data.publicUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
}

export function UsersView({ data }: { data: WorkspaceData }) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProfileStatus | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [section, setSection] = useState<'directory' | 'org'>('directory');
  const [selected, setSelected] = useState<Profile | null>(null);
  const users = useMemo(() => data.users ?? [], [data.users]);
  const areas = useMemo(() => Array.from(new Set(users.map(user => user.area?.trim() || 'Sin definir'))).sort((a, b) => a.localeCompare(b, 'es-MX')), [users]);
  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    return users.filter(user => {
      const text = `${user.full_name} ${user.email} ${user.area ?? ''} ${user.job_title ?? ''}`.toLocaleLowerCase('es-MX');
      return (!normalized || text.includes(normalized)) && (roleFilter === 'all' || user.role === roleFilter) && (statusFilter === 'all' || user.status === statusFilter) && (areaFilter === 'all' || (user.area?.trim() || 'Sin definir') === areaFilter);
    });
  }, [areaFilter, query, roleFilter, statusFilter, users]);
  const active = users.filter(user => user.status === 'active').length;
  const pending = users.filter(user => user.status === 'pending').length;

  return <>
    <div className="admin-summary"><div><Users size={23} /><strong>{users.length}</strong><span>Cuentas</span></div><div><Clock3 size={23} /><strong>{pending}</strong><span>Pendientes</span></div><div><ShieldCheck size={23} /><strong>{active}</strong><span>Accesos activos</span></div><div><Building2 size={23} /><strong>{areas.length}</strong><span>Áreas</span></div></div>
    <section className="panel users-panel">
      <div className="panel-heading user-directory-heading"><div><p className="eyebrow">PERSONAS Y ACCESOS</p><h2>Directorio del equipo</h2><p>Una ficha por persona: identidad, lugar en la organización y alcance de acceso.</p></div><PdfButton /></div>
      <div className="user-view-tabs" role="tablist" aria-label="Vista de personas"><button className={section === 'directory' ? 'active' : ''} role="tab" aria-selected={section === 'directory'} onClick={() => setSection('directory')}><LayoutList size={16} />Directorio</button><button className={section === 'org' ? 'active' : ''} role="tab" aria-selected={section === 'org'} onClick={() => setSection('org')}><GitBranch size={16} />Organigrama</button></div>
      {section === 'directory' ? <>
        <div className="user-filters"><label className="search-input"><Search size={16} /><input placeholder="Buscar nombre, correo, área o puesto…" aria-label="Buscar personas" value={query} onChange={event => setQuery(event.target.value)} /></label><label className="filter-select"><Filter size={15} /><select aria-label="Filtrar por rol" value={roleFilter} onChange={event => setRoleFilter(event.target.value as Role | 'all')}><option value="all">Todos los roles</option>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="filter-select"><select aria-label="Filtrar por estado" value={statusFilter} onChange={event => setStatusFilter(event.target.value as ProfileStatus | 'all')}><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="filter-select"><select aria-label="Filtrar por área" value={areaFilter} onChange={event => setAreaFilter(event.target.value)}><option value="all">Todas las áreas</option>{areas.map(area => <option value={area} key={area}>{area}</option>)}</select></label></div>
        <div className="table-scroll"><table className="users-table"><thead><tr><th>PERSONA</th><th>ÁREA Y PUESTO</th><th>ROL</th><th>ESTADO</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{filteredUsers.map(user => <tr key={user.id}><td><span className="user-name"><Avatar src={user.avatar_url} name={user.full_name} email={user.email} /><span><strong>{user.full_name || 'Sin nombre'}</strong><small>{user.email}</small></span></span></td><td><strong>{user.area || 'Sin definir'}</strong><small className="table-subtext">{user.job_title || 'Integrante'}</small></td><td><span className="role-cell"><ShieldCheck size={14} />{roleLabels[user.role]}</span></td><td><span className={`badge ${statusClasses[user.status]}`}>{statusLabels[user.status]}</span></td><td>{user.id === data.profile?.id ? <span className="chip">Tu cuenta</span> : <button className="button secondary small" onClick={() => setSelected(user)}>Administrar <ArrowUpRight size={14} /></button>}</td></tr>)}</tbody></table></div>
        {!filteredUsers.length && <div className="empty-state"><Users size={28} /><h3>No hay personas con esos filtros</h3><p>Prueba otra búsqueda o limpia los filtros.</p></div>}
      </> : <OrgChart users={users} />}
    </section>
    <section className="panel permissions-panel"><div className="panel-heading"><div><h2>Qué puede hacer cada rol</h2><p>El rol define el alcance general. El permiso de proyecto agrega o retira acceso puntual.</p></div><span className="chip"><LockKeyhole size={14} />Acceso controlado</span></div><div className="permission-grid">{(Object.keys(roleLabels) as Role[]).map(role => <article className="permission-card" key={role}><div><ShieldCheck size={18} /><strong>{roleLabels[role]}</strong></div><p>{roleDescriptions[role]}</p><small>{role === 'superadmin' ? 'Todos los proyectos y configuración' : role === 'admin' ? 'Proyectos operativos permitidos' : role === 'analyst' ? permissionLabels.editor : permissionLabels.viewer}</small></article>)}</div></section>
    <div className="notice info"><LockKeyhole size={19} /><p>Solo el superusuario modifica roles, perfiles y permisos. Cada cambio queda en la actividad de la plataforma.</p></div>
    {selected && <UserDialog user={selected} data={data} onClose={() => setSelected(null)} />}
  </>;
}

function OrgChart({ users }: { users: Profile[] }) {
  const byId = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);
  const byManager = useMemo(() => {
    const result = new Map<string, Profile[]>();
    users.forEach(user => { if (!user.manager_id || !byId.has(user.manager_id)) return; const children = result.get(user.manager_id) ?? []; children.push(user); result.set(user.manager_id, children); });
    return result;
  }, [byId, users]);
  const roots = users.filter(user => !user.manager_id || !byId.has(user.manager_id));
  const visibleRoots = roots.length ? roots : users.slice(0, 1);
  if (!users.length) return <div className="empty-state"><GitBranch size={32} /><h3>El organigrama aparecerá aquí</h3><p>Primero agrega personas al directorio.</p></div>;
  return <div className="org-chart"><div className="org-chart-intro"><div><h3>Cómo se organiza el equipo</h3><p>La relación se define desde el campo “Responsable directo” de cada ficha.</p></div><span className="chip">{users.length} personas</span></div><div className="org-roots">{visibleRoots.map(user => <OrgBranch key={user.id} user={user} byManager={byManager} trail={new Set()} />)}</div></div>;
}

function OrgBranch({ user, byManager, trail }: { user: Profile; byManager: Map<string, Profile[]>; trail: Set<string> }) {
  const nextTrail = new Set(trail); nextTrail.add(user.id);
  const children = trail.has(user.id) ? [] : (byManager.get(user.id) ?? []).filter(child => !nextTrail.has(child.id));
  return <div className="org-branch"><article className="org-node"><Avatar src={user.avatar_url} name={user.full_name} email={user.email} /><div><strong>{user.full_name || 'Sin nombre'}</strong><span>{user.job_title || 'Integrante'}</span><small>{user.area || 'Sin definir'} · {roleLabels[user.role]}</small></div><span className={`badge ${statusClasses[user.status]}`}>{statusLabels[user.status]}</span></article>{children.length > 0 && <div className="org-children">{children.map(child => <OrgBranch key={child.id} user={child} byManager={byManager} trail={nextTrail} />)}</div>}</div>;
}

function UserDialog({ user, data, onClose }: { user: Profile; data: WorkspaceData; onClose: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [area, setArea] = useState(user.area || 'Sin definir');
  const [jobTitle, setJobTitle] = useState(user.job_title || 'Integrante');
  const [managerId, setManagerId] = useState(user.manager_id || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || null);
  const [role, setRole] = useState<Role>(user.role);
  const [status, setStatus] = useState<ProfileStatus>(user.status);
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? '');
  const [permission, setPermission] = useState<MemberPermission>('viewer');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const managers = (data.users ?? []).filter(candidate => candidate.id !== user.id && candidate.status === 'active');
  const assigned = data.members?.filter(member => member.user_id === user.id) ?? [];

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setUploading(true); setMessage(''); setSuccess(false);
    try { setAvatarUrl(await uploadAvatarFile(file, user.id)); setMessage('Foto lista para guardar en el perfil.'); setSuccess(true); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo preparar la foto.'); } finally { setUploading(false); }
  }
  async function save(action: 'profile' | 'user' | 'member') {
    if (busy) return; setBusy(true); setMessage(''); setSuccess(false);
    try {
      const result = action === 'profile'
        ? await updateUserProfile({ id: user.id, fullName, area, jobTitle, avatarUrl, managerId: managerId || null })
        : action === 'user'
          ? await manageUser({ id: user.id, role, status })
          : await assignMember({ projectId, userId: user.id, permission });
      if (!result.ok) setMessage(result.error); else { setSuccess(true); setMessage(action === 'profile' ? 'Perfil actualizado.' : action === 'user' ? 'Rol y estado actualizados.' : 'Permiso de proyecto actualizado.'); router.refresh(); }
    } catch { setMessage('No pudimos confirmar el cambio. Actualiza la vista para comprobarlo.'); } finally { setBusy(false); }
  }
  return <Dialog wide title={`Administrar a ${user.full_name || user.email}`} onClose={() => { if (!busy && !uploading) onClose(); }}><div className="dialog-body project-form user-dialog-body"><div className="profile-photo-field"><div><Avatar src={avatarUrl} name={fullName} email={user.email} size="large" /><label className="button secondary small photo-picker"><Camera size={15} />{uploading ? 'Subiendo…' : 'Cambiar foto'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} disabled={busy || uploading} /></label></div><div><strong>{user.email}</strong><p>JPG, PNG o WebP · máximo 5 MB.</p></div></div><div className="form-two-cols"><label className="form-field">Nombre completo<input value={fullName} onChange={event => setFullName(event.target.value)} minLength={2} maxLength={100} disabled={busy} /></label><label className="form-field">Área<input value={area} onChange={event => setArea(event.target.value)} minLength={2} maxLength={100} disabled={busy} /></label><label className="form-field">Puesto<input value={jobTitle} onChange={event => setJobTitle(event.target.value)} minLength={2} maxLength={120} disabled={busy} /></label><label className="form-field">Responsable directo<select value={managerId} onChange={event => setManagerId(event.target.value)} disabled={busy}><option value="">Sin responsable directo</option>{managers.map(manager => <option value={manager.id} key={manager.id}>{manager.full_name || manager.email} · {manager.area || 'Sin definir'}</option>)}</select></label></div><button className="button primary" disabled={busy || uploading} onClick={() => save('profile')}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}Guardar perfil</button><div className="form-divider" /><h3>Acceso de la cuenta</h3><div className="form-two-cols"><label className="form-field">Rol<select value={role} onChange={event => setRole(event.target.value as Role)} disabled={busy}>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="form-field">Estado<select value={status} onChange={event => setStatus(event.target.value as ProfileStatus)} disabled={busy}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>{role === 'superadmin' && <div className="notice warning"><ShieldCheck size={19} /><p>Este rol administra usuarios, proyectos, permisos y configuración.</p></div>}<button className="button secondary" disabled={busy} onClick={() => save('user')}>{busy ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}Guardar rol y estado</button><div className="form-divider" /><h3>Acceso a un proyecto</h3><p className="muted">La asignación agrega acceso puntual al rol general.</p>{data.projects.length ? <><label className="form-field">Proyecto<select value={projectId} onChange={event => setProjectId(event.target.value)} disabled={busy}>{data.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="form-field">Permiso<select value={permission} onChange={event => setPermission(event.target.value as MemberPermission)} disabled={busy}><option value="viewer">{permissionLabels.viewer}</option><option value="editor">{permissionLabels.editor}</option><option value="none">Retirar asignación</option></select></label><button className="button secondary" disabled={busy || !projectId} onClick={() => save('member')}>Guardar permiso</button></> : <p className="muted">Crea un proyecto antes de asignar acceso.</p>}<ul className="member-list">{assigned.map(member => <li key={member.project_id}><span>{data.projects.find(project => project.id === member.project_id)?.name || 'Proyecto no disponible'}</span><span className="chip">{permissionLabels[member.permission]}</span></li>)}</ul>{message && <p role={success ? 'status' : 'alert'} className={`notice ${success ? 'success' : 'error'}`}>{message}</p>}</div></Dialog>;
}

export function ProfileSettings({ profile }: { profile?: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || !profile) return;
    setUploading(true); setMessage('');
    try { setAvatarUrl(await uploadAvatarFile(file, profile.id)); setMessage('Foto preparada. Guarda tu perfil para confirmar.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo preparar la foto.'); } finally { setUploading(false); }
  }
  async function save() {
    if (!profile || busy) return; setBusy(true); setMessage('');
    try { const result = await updateMyProfile({ fullName, avatarUrl }); if (!result.ok) setMessage(result.error); else { setMessage('Perfil actualizado.'); router.refresh(); } } catch { setMessage('No se pudo actualizar tu perfil.'); } finally { setBusy(false); }
  }
  return <section className="panel settings-card profile-settings-card"><div className="panel-heading"><div><h2>Mi perfil</h2><p>Tu foto y nombre aparecen en el directorio y en tu espacio.</p></div></div><div className="profile-settings-content"><Avatar src={avatarUrl} name={fullName} email={profile?.email} size="large" /><div className="profile-settings-fields"><label className="form-field">Nombre completo<input value={fullName} onChange={event => setFullName(event.target.value)} minLength={2} maxLength={100} disabled={busy} /></label><p className="muted">{profile?.email}</p><label className="button secondary small photo-picker"><ImagePlus size={15} />{uploading ? 'Subiendo…' : 'Cambiar foto'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} disabled={busy || uploading || !profile} /></label><button className="button primary small" onClick={save} disabled={busy || uploading || !profile}>{busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}Guardar perfil</button></div></div>{message && <p className="notice info">{message}</p>}</section>;
}

export function HistoryView({ data }: { data: WorkspaceData }) {
  const [query, setQuery] = useState(''); const batches = (data.imports ?? []).filter(batch => `${batch.filename} ${data.projects.find(project => project.id === batch.project_id)?.name}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="module-intro"><span><History size={26} /></span><div><h2>Cada actualización tiene una historia.</h2><p>La carga más reciente alimenta el proyecto. Las anteriores se conservan para trazabilidad.</p></div></div><section className="panel"><div className="panel-heading"><div><h2>Historial de cargas</h2><p>Últimas 200 cargas de tus proyectos accesibles.</p></div><label className="search-input"><Search size={16} /><input aria-label="Buscar cargas" placeholder="Archivo o proyecto…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>{batches.length ? <div className="table-scroll"><table><thead><tr><th>ARCHIVO</th><th>PROYECTO</th><th>REGISTROS</th><th>CARGADO</th><th>VERSIÓN</th></tr></thead><tbody>{batches.map(batch => { const project = data.projects.find(item => item.id === batch.project_id); return <tr key={batch.id}><td><span className="inline-icon"><FileSpreadsheet size={17} />{batch.filename}</span></td><td><Link href={`/proyectos/${batch.project_id}`}>{project?.name}</Link></td><td>{number(batch.row_count)}</td><td>{timestamp(batch.created_at)}</td><td><span className={`badge ${project?.activeBatchId === batch.id ? 'badge-ready' : 'badge-planned'}`}>{project?.activeBatchId === batch.id ? 'En uso' : 'Histórica'}</span></td></tr>; })}</tbody></table></div> : <div className="empty-state"><History size={32} /><h3>Tu primera carga aparecerá aquí</h3><p>Cuando guardes un archivo, verás su fecha, proyecto y número de registros.</p></div>}</section></>;
}

export function ActivityView({ data }: { data: WorkspaceData }) {
  const labels: Record<string, string> = { 'project.created': 'Proyecto creado', 'import.completed': 'Archivo incorporado', 'user.access_changed': 'Acceso actualizado', 'member.updated': 'Permiso de proyecto actualizado', 'user.profile_updated': 'Perfil actualizado' };
  return <section className="panel"><div className="panel-heading"><div><h2>El registro de tu operación</h2><p>Últimos 100 eventos accesibles. Generados por la base de datos.</p></div><span className="chip"><ShieldCheck size={14} />Trazabilidad</span></div><div className="activity-feed">{data.activity?.map(entry => <article key={entry.id}><span className="activity-node">{entry.action.startsWith('import') ? <FileSpreadsheet size={18} /> : entry.action.startsWith('project') ? <Layers3 size={18} /> : <ShieldCheck size={18} />}</span><div><h3>{labels[entry.action] ?? 'Actividad del proyecto'}</h3><p>{entry.detail}</p><small>{data.projects.find(project => project.id === entry.project_id)?.name ?? 'Administración'} · {timestamp(entry.created_at)}</small></div></article>)}{!data.activity?.length && <div className="empty-state"><Clock3 size={32} /><h3>Un espacio listo para empezar</h3><p>Las creaciones de proyectos, cargas y cambios de acceso se registrarán aquí.</p></div>}</div></section>;
}

export function DesignView() {
  return <><section className="design-intro"><div><p className="eyebrow">TRUPER WORKSPACE · SISTEMA DE DISEÑO 1.0</p><h2>Distintos procesos.<br /><em>Una misma experiencia.</em></h2><p>Una base compartida de componentes, estados y reglas. Cada módulo aporta sus datos y sus indicadores; el lenguaje visual permanece consistente.</p></div><span className="design-monogram"><Layers3 size={70} strokeWidth={1} /></span></section><div className="design-grid"><section className="panel design-section"><div className="panel-heading"><div><h2>01 / Identidad</h2><p>Precisión industrial. Claridad comercial.</p></div></div><div className="color-swatches">{[['accent', 'Naranja Truper'], ['sidebar', 'Grafito'], ['green', 'Confirmación'], ['red', 'Error']].map(([color, name]) => <div key={color}><i style={{ background: `var(--${color})` }} /><strong>{name}</strong><code>--{color}</code></div>)}</div></section><section className="panel design-section"><div className="panel-heading"><div><h2>02 / Tipografía</h2><p>Una jerarquía que ayuda a leer y decidir.</p></div></div><div className="type-specimen"><span>Manrope / Títulos</span><h3>Hecho para avanzar.</h3><span>Inter / Información</span><p>Etiquetas claras. Importes completos. La acción importante siempre a la vista.</p></div></section></div><section className="panel design-section"><div className="panel-heading"><div><h2>03 / Indicadores, con un contrato común</h2><p>Estos componentes son los mismos que usa el dashboard. Sin datos, muestran un estado vacío.</p></div></div><div className="design-metrics"><MetricCard label="Indicador principal" value="—" detail="Sin datos en el periodo" icon={Wallet} primary /><MetricCard label="Indicador complementario" value="—" detail="Unidad y definición visibles" icon={Layers3} /></div><div className="metric-dictionary">{moduleRegistry.ventas.metrics.map(metric => <article key={metric.id}><strong>{metric.label}<span>{metric.unit}</span></strong><p>{metric.definition}</p></article>)}</div></section><div className="design-grid"><section className="panel design-section"><div className="panel-heading"><div><h2>04 / Acciones y estados</h2><p>Una acción principal por flujo. Feedback que se entiende.</p></div></div><div className="design-samples"><Link className="button primary" href="/proyectos">Ver proyectos <ArrowRight size={16} /></Link><Link className="button secondary" href="/fuentes">Ver fuentes</Link><button className="button primary" disabled><LoaderCircle size={16} />Procesando</button><span className="badge badge-ready"><CheckCircle2 size={13} />Completado</span><span className="badge badge-attention">Requiere revisión</span></div></section><section className="panel design-section"><div className="panel-heading"><div><h2>05 / Reglas para nuevos módulos</h2><p>La misma calidad desde el primer componente.</p></div></div><ul className="design-rules"><li>Encabezado, filtros, indicadores y detalle.</li><li>Datos reales; cero no significa dato ausente.</li><li>Moneda, periodo, origen y definición explícitos.</li><li>Estados de carga, vacío, error y acceso.</li><li>Teclado, contraste, móvil y movimiento reducido.</li></ul></section></div></>;
}
