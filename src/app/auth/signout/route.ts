import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  const client = await createSupabaseServer();
  await client.auth.signOut();
  return NextResponse.redirect(new URL('/login', url.origin), 303);
}
