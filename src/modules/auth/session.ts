import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/supabase/config';
import type { Profile } from './types';

export const getSession = cache(async () => {
  if (!supabaseConfig()) return { state: 'unconfigured' as const };
  const client = await createSupabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { state: 'anonymous' as const };
  const rich = await client.from('truper_profiles').select('id,email,full_name,role,status,created_at,area,job_title,avatar_url,manager_id').eq('id', user.id).single();
  if (!rich.error && rich.data) return { state: 'authenticated' as const, user, profile: rich.data as Profile, client };
  if (rich.error?.code !== '42703') return { state: 'schema_missing' as const, user };
  const legacy = await client.from('truper_profiles').select('id,email,full_name,role,status,created_at').eq('id', user.id).single();
  if (legacy.error || !legacy.data) return { state: 'schema_missing' as const, user };
  return { state: 'authenticated' as const, user, profile: { ...legacy.data, area: 'Sin definir', job_title: 'Integrante', avatar_url: null, manager_id: null } as Profile, client };
});

export async function requireSession() {
  const session = await getSession();
  if (session.state === 'unconfigured' || session.state === 'anonymous') redirect('/login');
  if (session.state === 'schema_missing') redirect('/acceso?estado=configuracion');
  if (session.profile.status !== 'active') redirect('/acceso');
  return session;
}
