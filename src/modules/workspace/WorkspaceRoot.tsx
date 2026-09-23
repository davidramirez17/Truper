'use client';

import { useEffect, useState } from 'react';
import type { WorkspaceData, WorkspaceView } from '../analytics/types';
import { loadLocalData } from '../sources/local-store';
import { Workspace } from './Workspace';

export function WorkspaceRoot(props: { data: WorkspaceData; view: WorkspaceView; projectId?: string }) {
  const [local, setLocal] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (props.data.mode !== 'local') return;
    let cancelled = false;
    loadLocalData().then(data => { if (!cancelled) { setLocal(data); setError(''); } }).catch(() => { if (!cancelled) setError('No pudimos abrir tus datos locales. Habilita el almacenamiento del navegador e inténtalo de nuevo.'); });
    return () => { cancelled = true; };
  }, [props.data.mode, props.projectId, revision]);
  useEffect(() => {
    const reload = () => setRevision(value => value + 1);
    window.addEventListener('truper-data-updated', reload);
    window.addEventListener('focus', reload);
    return () => { window.removeEventListener('truper-data-updated', reload); window.removeEventListener('focus', reload); };
  }, []);
  if (props.data.mode === 'local' && error) return <main className="standalone-state"><h1>Tus datos siguen en este navegador</h1><p role="alert">{error}</p><button className="button primary" onClick={() => setRevision(value => value + 1)}>Volver a intentar</button><a href="/">Volver a la demostración</a></main>;
  if (props.data.mode === 'local' && !local) return <main className="standalone-state" role="status"><span className="loading-brand">T</span><h1>Abriendo tu espacio…</h1><p>Recuperando tus proyectos y archivos locales.</p></main>;
  const data = props.data.mode === 'local' ? local! : props.data;
  if (props.view === 'detail' && !data.projects.some(project => project.id === props.projectId)) return <main className="standalone-state"><h1>No encontramos ese proyecto</h1><p>Puede pertenecer a otro espacio o estar guardado en otro navegador.</p><a className="button primary" href={`/proyectos?modo=${data.mode}`}>Ver mis proyectos</a></main>;
  return <Workspace {...props} data={data} />;
}
