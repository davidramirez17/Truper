import { notFound } from 'next/navigation';
import { getWorkspaceData } from '@/modules/analytics/service';
import type { WorkspaceView } from '@/modules/analytics/types';
import { emptyLocalData } from '@/modules/sources/local-store';
import { WorkspaceRoot } from '@/modules/workspace/WorkspaceRoot';

export const dynamic = 'force-dynamic';
const views: Record<string, WorkspaceView> = { '': 'overview', proyectos: 'projects', fuentes: 'sources', reportes: 'reports', alertas: 'alerts', configuracion: 'settings' };

export default async function Page({ params, searchParams }: { params: Promise<{ slug?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug = [] } = await params;
  const query = await searchParams;
  const detail = slug.length === 2 && slug[0] === 'proyectos';
  const view = detail ? 'detail' : slug.length <= 1 ? views[slug[0] ?? ''] : undefined;
  if (!view) notFound();
  const mode = query.modo === 'real' ? 'real' : query.modo === 'local' ? 'local' : 'demo';
  const data = mode === 'local' ? emptyLocalData() : await getWorkspaceData(mode);
  if (detail && mode !== 'local' && !data.projects.some(project => project.id === slug[1])) notFound();
  return <WorkspaceRoot data={data} view={view} projectId={detail ? slug[1] : undefined} />;
}
