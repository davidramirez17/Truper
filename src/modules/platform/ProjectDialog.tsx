'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FolderPlus, LoaderCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { createProject } from './actions';
export function ProjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError('');
    try { const result = await createProject({ name: form.get('name'), description: form.get('description') }); if (!result.ok) { setError(result.error); setBusy(false); return; } onClose(); router.push(`/proyectos/${result.data}`); router.refresh(); }
    catch { setError('No se pudo confirmar la creación. Revisa la lista de proyectos antes de reintentar.'); setBusy(false); }
  }
  return <Dialog title="Un nuevo espacio para tu proceso" onClose={() => { if (!busy) onClose(); }}><form onSubmit={submit}><div className="dialog-body project-form"><span className="form-emblem"><FolderPlus size={27} /></span><p className="muted">Crea el proyecto una vez. Después actualiza su información con cada nuevo archivo.</p><label className="form-field">Nombre del proyecto<input name="name" placeholder="Ej. Facturación de sucursales" minLength={2} maxLength={100} required disabled={busy} autoFocus /></label><label className="form-field">Descripción<textarea name="description" placeholder="Qué proceso vas a seguir y para qué servirá." maxLength={1000} rows={3} disabled={busy} /></label><div className="module-contract"><span>BASE DE ANÁLISIS</span><strong>Ventas y facturación</strong><p>Importes, movimientos, clientes y zonas. Los próximos tipos de proceso tendrán su propio contrato de datos y compartirán el sistema de diseño.</p></div>{error && <p className="notice error" role="alert">{error}</p>}</div><div className="dialog-footer"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}Crear proyecto</button></div></form></Dialog>;
}
