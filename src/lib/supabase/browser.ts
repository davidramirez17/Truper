'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';

export function createSupabaseBrowser() {
  const config = supabaseConfig();
  if (!config) throw new Error('La conexión a Supabase todavía no está configurada.');
  return createBrowserClient(config.url, config.key);
}
