import { redirect } from 'next/navigation';
import { AuthShell } from '@/modules/auth/AuthShell';
import { getSession } from '@/modules/auth/session';
export default async function Password() { const session = await getSession(); if (session.state !== 'authenticated' && session.state !== 'schema_missing') redirect('/recuperar'); return <AuthShell mode="password" configured />; }
