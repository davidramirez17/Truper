import { redirect } from 'next/navigation';
import { AuthShell } from '@/modules/auth/AuthShell';
import { getSession } from '@/modules/auth/session';
import { supabaseConfig } from '@/lib/supabase/config';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session.state === 'authenticated') redirect(session.profile.status === 'active' ? '/' : '/acceso');
  return <AuthShell mode="login" configured={!!supabaseConfig()} linkError={(await searchParams).error === 'enlace'} />;
}
