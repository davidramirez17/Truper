import 'server-only';
import { requireSession } from '../auth/session';
import type { SystemHealth, SystemHealthTable } from '../analytics/types';

type RpcTable = Partial<Record<keyof SystemHealthTable, number | string | null>> & { name?: string };
type RpcHealth = {
  databaseSizeBytes?: number | string | null;
  generatedAt?: string | null;
  statistics?: {
    cacheHitRatio?: number | string | null;
    activeConnections?: number | string | null;
    commits?: number | string | null;
    rollbacks?: number | string | null;
    tempBytes?: number | string | null;
  } | null;
  tables?: RpcTable[] | null;
};

const numeric = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nullableNumeric = (value: unknown) => value === null || value === undefined ? null : numeric(value);

const table = (value: RpcTable): SystemHealthTable => ({
  name: String(value.name ?? 'Tabla sin nombre'),
  rowsEstimate: numeric(value.rowsEstimate),
  totalBytes: numeric(value.totalBytes),
  indexBytes: numeric(value.indexBytes),
  liveTuples: numeric(value.liveTuples),
  deadTuples: numeric(value.deadTuples),
  seqScans: numeric(value.seqScans),
  idxScans: numeric(value.idxScans),
  lastAnalyze: typeof value.lastAnalyze === 'string' ? value.lastAnalyze : null,
  lastVacuum: typeof value.lastVacuum === 'string' ? value.lastVacuum : null,
});

export async function getSystemHealth(): Promise<SystemHealth> {
  const { client, profile } = await requireSession();
  if (profile.role !== 'superadmin') {
    return {
      databaseSizeBytes: 0,
      databaseLimitBytes: null,
      cacheHitRatio: null,
      activeConnections: null,
      commits: null,
      rollbacks: null,
      tempBytes: null,
      tables: [],
      generatedAt: new Date().toISOString(),
      queryMs: 0,
      error: 'Solo el superusuario puede consultar la salud de la plataforma.',
    };
  }

  const started = performance.now();
  const { data, error } = await client.rpc('truper_get_system_health');
  const queryMs = Math.round(performance.now() - started);
  if (error || !data) {
    return {
      databaseSizeBytes: 0,
      databaseLimitBytes: null,
      cacheHitRatio: null,
      activeConnections: null,
      commits: null,
      rollbacks: null,
      tempBytes: null,
      tables: [],
      generatedAt: new Date().toISOString(),
      queryMs,
      error: 'No se pudo consultar la salud de Supabase. Aplica la migración de observabilidad y vuelve a intentar.',
    };
  }

  const payload = data as RpcHealth;
  const stats = payload.statistics ?? {};
  const configuredLimit = Number(process.env.SUPABASE_DATABASE_LIMIT_BYTES);
  return {
    databaseSizeBytes: numeric(payload.databaseSizeBytes),
    databaseLimitBytes: Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : null,
    cacheHitRatio: nullableNumeric(stats.cacheHitRatio),
    activeConnections: nullableNumeric(stats.activeConnections),
    commits: nullableNumeric(stats.commits),
    rollbacks: nullableNumeric(stats.rollbacks),
    tempBytes: nullableNumeric(stats.tempBytes),
    tables: (payload.tables ?? []).map(table),
    generatedAt: typeof payload.generatedAt === 'string' ? payload.generatedAt : new Date().toISOString(),
    queryMs,
  };
}
