import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const client = await createSupabaseServer();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(url.searchParams.get('tipo') === 'recuperar' ? '/actualizar-clave' : '/', url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=enlace', url.origin));
}
