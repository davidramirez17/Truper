import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from '@/lib/supabase/config';

export async function middleware(request: NextRequest) {
  const config = supabaseConfig();
  let response = NextResponse.next({ request });
  if (!config) return response;
  const supabase = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: values => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  // Verify and refresh; protected pages/actions also validate the user and DB role.
  await supabase.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|woff2)$).*)'] };
