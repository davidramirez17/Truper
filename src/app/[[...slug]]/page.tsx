import { notFound } from 'next/navigation';
import { getWorkspaceData } from '@/modules/analytics/service';
import { getSystemHealth } from '@/modules/platform/health';
import type { WorkspaceView } from '@/modules/analytics/types';
import { Workspace } from '@/modules/workspace/Workspace';
export const dynamic = 'force-dynamic';
const views: Record<string, WorkspaceView> = { '': 'overview', proyectos: 'projects', fuentes: 'sources', reportes: 'reports', alertas: 'alerts', configuracion: 'settings', usuarios: 'users', cargas: 'history', actividad: 'activity', diseno: 'design', sistema: 'system' };
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const detail = slug.length === 2 && slug[0] === 'proyectos';
  const view = detail ? 'detail' : slug.length <= 1 ? views[slug[0] ?? ''] : undefined;
  if (!view) notFound();
  const data = await getWorkspaceData();
  if (view === 'users' && data.profile?.role !== 'superadmin') notFound();
  if (['system', 'design'].includes(view) && data.profile?.role !== 'superadmin') notFound();
  if (detail && !data.projects.some(project => project.id === slug[1])) notFound();
  const systemHealth = view === 'system' ? await getSystemHealth() : undefined;
  return <Workspace data={data} view={view} projectId={detail ? slug[1] : undefined} systemHealth={systemHealth} />;
}
