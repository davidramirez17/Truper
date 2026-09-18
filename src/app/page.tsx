import { notificarFallo } from '@/lib/alertService';
import { leerFacturacion, type FilaFacturacion } from '@/lib/excelReader';
import { supabase } from '@/lib/supabase';
import { GraficoVentas } from '@/components/GraficoVentas';
import { KpiCard } from '@/components/KpiCard';
import { ModuloError } from '@/components/ModuloError';
import { Navbar } from '@/components/Navbar';

type ResultadoProyecto = {
  error: boolean;
  message: string;
  data: FilaFacturacion[] | null;
};

async function getProyectoFacturacion(): Promise<ResultadoProyecto> {
  try {
    const resultado = await leerFacturacion();

    if (!resultado.ok) {
      await notificarFallo({ proyecto: 'Diario de Facturación', error: resultado.message });
      return { error: true, message: resultado.message, data: null };
    }

    return { error: false, message: 'OK', data: resultado.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado al procesar facturación.';
    await notificarFallo({ proyecto: 'Diario de Facturación', error: message });
    return { error: true, message, data: null };
  }
}

async function getProyectoSupabase() {
  try {
    if (!supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const { data, error } = await supabase
      .from('kpis_ventas')
      .select('ventas_totales, kpi_semanal')
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('No hay indicadores disponibles en Supabase.');

    return {
      error: false,
      message: 'OK',
      data: { ventasTotales: Number(data.ventas_totales || 0), kpiSemanal: String(data.kpi_semanal || '--') },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado en el proyecto.';
    await notificarFallo({ proyecto: 'Consolidado Supabase', error: message });
    return { error: true, message, data: null };
  }
}

export default async function Home() {
  const [facturacion, proyectoSupa] = await Promise.all([
    getProyectoFacturacion(),
    getProyectoSupabase(),
  ]);
  const ventas = proyectoSupa.data?.ventasTotales ?? 0;

  return (
    <main className="min-h-screen pb-10">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-medium text-sky-300">Lunes, 14 de septiembre de 2026</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Una vista clara para decidir más rápido.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Indicadores consolidados de los proyectos administrativos del área de ventas.</p>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard label="Ventas globales" value={`$${ventas.toLocaleString('es-MX')}`} detail="Acumulado disponible" tone="sky" />
          <KpiCard label="Variación semanal" value={proyectoSupa.data?.kpiSemanal ?? '--'} detail="Contra semana anterior" tone="emerald" />
          <KpiCard label="Módulos activos" value={facturacion.error ? '1 / 2' : '2 / 2'} detail="Estado de los proyectos" tone={facturacion.error ? 'amber' : 'emerald'} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tendencia</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Ventas por periodo</h2>
            </div>
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" aria-label="Periodo del gráfico" defaultValue="semana">
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>
          <GraficoVentas datos={[{ etiqueta: 'Lun', valor: 380000 }, { etiqueta: 'Mar', valor: 520000 }, { etiqueta: 'Mié', valor: 420000 }, { etiqueta: 'Jue', valor: 610000 }, { etiqueta: 'Vie', valor: 560000 }]} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Proyectos</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Estado de procesamiento</h2>
          </div>
          <article className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 font-bold text-slate-900">Diario de Facturación</h3>
          {facturacion.error ? (
            <ModuloError proyecto="Diario de Facturación" message={facturacion.message} />
          ) : (
            <p className="text-sm text-emerald-700">{facturacion.data?.length ?? 0} filas procesadas correctamente.</p>
          )}
          </article>

          <article className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="mb-3 font-bold text-slate-900">Consolidado Supabase</h3>
          {proyectoSupa.error ? (
            <ModuloError proyecto="Consolidado Supabase" message={proyectoSupa.message} />
          ) : (
            <p className="text-sm text-emerald-700">Conexión disponible. Última actualización: hoy.</p>
          )}
          </article>
        </section>
      </div>
    </main>
  );
}
