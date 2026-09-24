'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

export type AuthMode = 'login' | 'register' | 'recover' | 'password';
const titles = { login: 'Bienvenido a tu espacio.', register: 'Hagamos equipo.', recover: 'Recupera tu acceso.', password: 'Una nueva contraseña.' };
const descriptions = { login: 'Entra y pon en marcha tu operación.', register: 'Crea tu cuenta. Un administrador aprobará tu acceso.', recover: 'Te enviaremos un enlace para restablecer tu contraseña.', password: 'Elige una contraseña de al menos 12 caracteres.' };

export function AuthForm({ mode, configured, linkError = false }: { mode: AuthMode; configured: boolean; linkError?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [message, setMessage] = useState(linkError ? 'El enlace venció o ya fue utilizado. Solicita uno nuevo.' : '');
  const [visible, setVisible] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') ?? '').trim();
    const password = String(values.get('password') ?? '');
    setStatus('sending'); setMessage('');
    try {
      const client = createSupabaseBrowser();
      if (mode === 'login') {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign('/'); return;
      }
      if (mode === 'register') {
        const { error } = await client.auth.signUp({ email, password, options: { data: { full_name: String(values.get('name') ?? '').trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
      }
      if (mode === 'recover') {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?tipo=recuperar` });
        if (error) throw error;
      }
      if (mode === 'password') {
        if (password !== String(values.get('confirmation') ?? '')) { setMessage('Las contraseñas no coinciden.'); setStatus('idle'); return; }
        const { error } = await client.auth.updateUser({ password }); if (error) throw error;
      }
      setStatus('success');
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      setMessage(code.includes('rate') ? 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' : code === 'email_not_confirmed' ? 'Confirma tu correo antes de entrar. Revisa el mensaje de verificación.' : mode === 'login' ? 'No pudimos iniciar sesión. Revisa tu correo y contraseña e inténtalo de nuevo.' : 'No pudimos completar la solicitud. Revisa tu conexión y vuelve a intentarlo.');
      setStatus('idle');
    }
  }
  return <div className="auth-form-content"><p className="eyebrow">TU EQUIPO. TUS PROCESOS. TU ESPACIO.</p><h1>{titles[mode]}</h1><p className="auth-description">{descriptions[mode]}</p>
    {!configured && <div className="notice warning auth-notice" role="status"><LockKeyhole size={19} /><p>Estamos preparando la conexión. El administrador debe configurar la URL y la clave pública de Supabase para habilitar el acceso.</p></div>}
    {status === 'success' ? <div className="auth-success" role="status"><CheckCircle2 size={35} /><h2>{mode === 'password' ? 'Contraseña actualizada' : 'Revisa tu correo'}</h2><p>{mode === 'password' ? 'Ya puedes continuar a tu espacio de trabajo.' : mode === 'register' ? 'Si la cuenta puede registrarse, recibirás un mensaje de verificación. Después, el superusuario podrá aprobar tu acceso.' : 'Si existe una cuenta con ese correo, recibirás un enlace para recuperar el acceso.'}</p><Link href={mode === 'password' ? '/' : '/login'} className="button primary">{mode === 'password' ? 'Entrar a mi espacio' : 'Volver al acceso'}<ArrowRight size={17} /></Link></div> : <form onSubmit={submit} className="auth-form">
      {mode === 'register' && <label className="auth-field"><span>Nombre completo</span><div><UserRound size={18} /><input name="name" autoComplete="name" placeholder="Tu nombre" required minLength={2} maxLength={100} disabled={!configured || status === 'sending'} /></div></label>}
      {mode !== 'password' && <label className="auth-field"><span>Correo electrónico</span><div><Mail size={18} /><input name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" required maxLength={254} disabled={!configured || status === 'sending'} /></div></label>}
      {mode !== 'recover' && <label className="auth-field"><span>Contraseña</span><div><LockKeyhole size={18} /><input name="password" type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? 'Tu contraseña' : 'Al menos 12 caracteres'} required minLength={mode === 'login' ? 1 : 12} maxLength={128} disabled={!configured || status === 'sending'} /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}
      {mode === 'password' && <label className="auth-field"><span>Confirma tu contraseña</span><div><LockKeyhole size={18} /><input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} disabled={status === 'sending'} /></div></label>}
      {mode === 'login' && <Link className="auth-recover" href="/recuperar">¿Olvidaste tu contraseña?</Link>}
      {message && <p className="notice error" role="alert">{message}</p>}
      <button className="button primary auth-submit" type="submit" disabled={!configured || status === 'sending'}>{status === 'sending' ? <LoaderCircle className="spin" size={19} /> : null}{status === 'sending' ? 'Un momento…' : mode === 'login' ? 'Entrar a mi espacio' : mode === 'register' ? 'Crear mi cuenta' : mode === 'recover' ? 'Enviar enlace' : 'Guardar contraseña'}{status !== 'sending' && <ArrowRight size={18} />}</button>
    </form>}
    <p className="auth-bottom-link">{mode === 'login' ? <>¿Aún no tienes acceso? <Link href="/registro">Solicitar una cuenta <ArrowUpRightSmall /></Link></> : <Link href="/login">← Volver al inicio de sesión</Link>}</p>
    <div className="auth-security"><LockKeyhole size={14} /><span>Acceso personal · Permisos por proyecto</span></div>
  </div>;
}
function ArrowUpRightSmall() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" stroke="currentColor" strokeWidth="1.5" /></svg>; }
