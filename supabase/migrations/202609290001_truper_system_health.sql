-- Read-only observability for the Truper superuser.
-- It exposes aggregate PostgreSQL statistics through a guarded RPC.
begin;

create or replace function truper_private.system_health()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if coalesce(truper_private.current_role(), '') <> 'superadmin' then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'databaseSizeBytes', pg_catalog.pg_database_size(pg_catalog.current_database()),
    'statistics', coalesce((
      select jsonb_build_object(
        'cacheHitRatio', case
          when coalesce(blks_hit, 0) + coalesce(blks_read, 0) = 0 then null
          else round((blks_hit::numeric * 100) / nullif(blks_hit + blks_read, 0), 2)
        end,
        'activeConnections', numbackends,
        'commits', xact_commit,
        'rollbacks', xact_rollback,
        'tempBytes', temp_bytes
      )
      from pg_catalog.pg_stat_database
      where datname = pg_catalog.current_database()
    ), jsonb_build_object(
      'cacheHitRatio', null,
      'activeConnections', null,
      'commits', null,
      'rollbacks', null,
      'tempBytes', null
    )),
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', c.relname,
        'rowsEstimate', greatest(c.reltuples, 0)::bigint,
        'totalBytes', pg_catalog.pg_total_relation_size(c.oid),
        'indexBytes', pg_catalog.pg_indexes_size(c.oid),
        'liveTuples', coalesce(s.n_live_tup, 0)::bigint,
        'deadTuples', coalesce(s.n_dead_tup, 0)::bigint,
        'seqScans', coalesce(s.seq_scan, 0)::bigint,
        'idxScans', coalesce(s.idx_scan, 0)::bigint,
        'lastAnalyze', s.last_analyze,
        'lastVacuum', s.last_vacuum
      ) order by c.relname)
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      left join pg_catalog.pg_stat_user_tables s on s.relid = c.oid
      where n.nspname = 'public'
        and c.relname in (
          'truper_profiles',
          'truper_projects',
          'truper_project_members',
          'truper_imports',
          'truper_sales_rows',
          'truper_audit'
        )
    ), '[]'::jsonb),
    'generatedAt', pg_catalog.clock_timestamp()
  ) into result;

  return result;
end;
$$;

create or replace function public.truper_get_system_health()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select truper_private.system_health();
$$;

revoke all on function truper_private.system_health() from public, anon;
grant execute on function truper_private.system_health() to authenticated;
revoke all on function public.truper_get_system_health() from public, anon;
grant execute on function public.truper_get_system_health() to authenticated;

commit;
