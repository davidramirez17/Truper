import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock3, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/ui/Brand';
import { getSession } from '@/modules/auth/session';
export default async function Access() {
  const session = await getSession();
  if (session.state === 'anonymous' || session.state === 'unconfigured') redirect('/login');
  if (session.state === 'authenticated' && session.profile.status === 'active') redirect('/');
  const missing = session.state === 'schema_missing';
  const suspended = session.state === 'authenticated' && session.profile.status === 'suspended';
  return <main className="access-page"><Brand /><section className="access-card"><span className="access-symbol">{suspended ? <ShieldCheck size={32} /> : <Clock3 size={32} />}</span><p className="eyebrow">TU CUENTA ESTÁ IDENTIFICADA</p><h1>{missing ? 'Estamos preparando tu espacio.' : suspended ? 'Tu acceso está suspendido.' : 'Ya estás un paso más cerca.'}</h1><p>{missing ? 'La sesión está activa, pero falta instalar la estructura de datos. El administrador debe aplicar la migración de Truper.' : suspended ? 'Contacta al superusuario para revisar el estado de tu cuenta.' : 'Tu cuenta está pendiente de aprobación. El superusuario te asignará un rol y los proyectos a los que puedes acceder.'}</p><span className="access-email">{session.user.email}</span><div><Link href="/" className="button secondary">Comprobar acceso</Link><form action="/auth/signout" method="post"><button className="button primary">Cerrar sesión</button></form></div></section></main>;
}
