import { NextResponse } from 'next/server';
import { notificarFallo } from '@/lib/alertService';

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.ALERT_API_TOKEN;
    if (expectedToken && request.headers.get('authorization') !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const proyecto = typeof body.proyecto === 'string' ? body.proyecto.trim() : '';
    const error = typeof body.error === 'string' ? body.error.trim() : '';

    if (!proyecto || !error) {
      return NextResponse.json({ error: 'proyecto y error son obligatorios.' }, { status: 400 });
    }

    await notificarFallo({ proyecto, error, contexto: 'Alerta recibida por API' });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Solicitud de alerta inválida.' }, { status: 400 });
  }
}
