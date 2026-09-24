import 'server-only';
import type { WorkspaceData, Project, ImportBatch, AuditEntry, ProjectMember, SalesRecord } from './types';
import type { Profile } from '../auth/types';
import { requireSession } from '../auth/session';
import { shiftDate } from './selectors';

type ProjectRow = { id: string; name: string; description: string; owner_id: string; active_batch_id: string | null };
export async function getWorkspaceData(): Promise<WorkspaceData> {
  const { client, profile } = await requireSession();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
  const result: WorkspaceData = { mode: 'real', asOf: today, projects: [], records: [], alerts: [], profile, users: [], imports: [], members: [], activity: [] };
  const [projectsQuery, importsQuery, membersQuery, auditQuery, usersQuery] = await Promise.all([
    client.from('truper_projects').select('id,name,description,owner_id,active_batch_id').order('created_at', { ascending: false }).limit(500),
    client.from('truper_imports').select('id,project_id,filename,row_count,created_at,created_by').order('created_at', { ascending: false }).limit(200),
    client.from('truper_project_members').select('project_id,user_id,permission').limit(1000),
    client.from('truper_audit').select('id,actor_id,project_id,action,detail,created_at').order('created_at', { ascending: false }).limit(100),
    profile.role === 'superadmin' ? client.from('truper_profiles').select('id,email,full_name,role,status,created_at').order('created_at', { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null }),
  ]);
  if ([projectsQuery, importsQuery, membersQuery, auditQuery, usersQuery].some(query => query.error)) {
    return { ...result, connectionError: 'No fue posible leer todos los datos. Revisa la conexión y las migraciones de la plataforma, y vuelve a intentar.' };
  }
  result.imports = importsQuery.data as ImportBatch[];
  result.members = membersQuery.data as ProjectMember[];
  result.activity = auditQuery.data as AuditEntry[];
  result.users = usersQuery.data as Profile[];
  const projectRows = projectsQuery.data as ProjectRow[];
  result.projects = projectRows.map((project, index): Project => {
    const batch = result.imports?.find(item => item.id === project.active_batch_id);
    const member = result.members?.find(item => item.project_id === project.id && item.user_id === profile.id);
    return { id: project.id, name: project.name, description: project.description, initials: project.name.slice(0,2).toUpperCase(), color: (['orange','blue','purple'] as const)[index % 3], status: project.active_batch_id ? 'ready' : 'unconfigured', source: batch?.filename ?? (project.active_batch_id ? 'Carga anterior' : 'Sin archivo cargado'), owner: result.users?.find(user => user.id === project.owner_id)?.full_name || (project.owner_id === profile.id ? profile.full_name : 'Equipo del proyecto'), updatedAt: null, activeBatchId: project.active_batch_id, canEdit: ['superadmin','admin'].includes(profile.role) || project.owner_id === profile.id || member?.permission === 'editor' };
  });
  const batches = projectRows.flatMap(project => project.active_batch_id ? [project.active_batch_id] : []);
  if (!batches.length) return result;
  const latest = await client.from('truper_sales_rows').select('record_date').in('batch_id', batches).order('record_date', { ascending: false }).limit(1).maybeSingle();
  if (latest.error) return { ...result, connectionError: 'No pudimos consultar los movimientos. Inténtalo nuevamente.' };
  result.asOf = latest.data?.record_date ?? today;
  const all: SalesRecord[] = [];
  for (let offset = 0; offset <= 50000; offset += 1000) {
    const page = await client.from('truper_sales_rows').select('id,project_id,record_date,client,region,amount_cents').in('batch_id', batches).gte('record_date', shiftDate(result.asOf, -59)).order('id').range(offset, offset + 999);
    if (page.error) return { ...result, records: [], connectionError: 'No se pudo completar la lectura. No se muestran totales parciales.' };
    if (offset === 50000 && page.data.length) return { ...result, records: [], connectionError: 'El volumen del periodo supera los 50,000 registros. Se requiere habilitar agregación en servidor antes de mostrar totales.' };
    all.push(...page.data.map(row => ({ id: `MOV-${row.id}`, projectId: row.project_id, date: row.record_date, client: row.client, region: row.region, amountCents: Number(row.amount_cents) })));
    if (page.data.length < 1000) break;
  }
  result.records = all;
  result.projects.forEach(project => {
    project.updatedAt = all.filter(row => row.projectId === project.id).reduce<string | null>((latest, row) => !latest || row.date > latest ? row.date : latest, null);
    if (!project.activeBatchId) result.alerts.push({ id: `source-${project.id}`, projectId: project.id, severity: 'info', title: 'Este proyecto espera su primer archivo', message: `Carga la información de ${project.name} para empezar a consultar sus indicadores.` });
  });
  return result;
}
