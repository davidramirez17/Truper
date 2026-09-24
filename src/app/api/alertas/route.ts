import { NextResponse } from 'next/server';
import { notificarFallo } from '@/lib/alertService';

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.ALERT_API_TOKEN;
    if (!expectedToken) return NextResponse.json({ error: 'Integración no habilitada.' }, { status: 503 });
    if (request.headers.get('authorization') !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const proyecto = typeof body.proyecto === 'string' ? body.proyecto.trim() : '';
    const error = typeof body.error === 'string' ? body.error.trim() : '';

    if (!proyecto || !error || proyecto.length > 100 || error.length > 2000) {
      return NextResponse.json({ error: 'proyecto y error son obligatorios.' }, { status: 400 });
    }

    await notificarFallo({ proyecto, error, contexto: 'Alerta recibida por API' });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Solicitud de alerta inválida.' }, { status: 400 });
  }
}
