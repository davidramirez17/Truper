import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('Postgres: aislamiento, roles, importación atómica e idempotencia', async t => {
  const db = new PGlite();
  const admin = '10000000-0000-4000-8000-000000000001';
  const analyst = '10000000-0000-4000-8000-000000000002';
  const outsider = '10000000-0000-4000-8000-000000000003';
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202609230001_truper_workspace.sql', import.meta.url), 'utf8'));
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3),($4,$5,$6),($7,$8,$9)', [admin,'owner@test.invalid',{full_name:'Owner'},analyst,'analyst@test.invalid',{full_name:'Analyst'},outsider,'outside@test.invalid',{full_name:'Outside',role:'superadmin',status:'active'}]);
  async function asUser<T>(id: string, action: () => Promise<T>) {
    await db.exec('set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
    try { return await action(); } finally { await db.exec('reset role'); }
  }
  await t.test('el registro ignora el rol aportado por el navegador', async () => {
    const { rows } = await db.query<{role:string;status:string}>('select role,status from public.truper_profiles where id=$1',[outsider]);
    assert.deepEqual(rows[0],{role:'viewer',status:'pending'});
  });
  await t.test('anon no tiene acceso a tablas ni RPC', async () => {
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.truper_sales_rows'),/permission denied/);
    await assert.rejects(db.query("select public.truper_create_project('Inyección','')"),/permission denied/);
    await db.exec('reset role');
  });
  await t.test('cuenta pendiente no puede crear proyectos ni elevar privilegios', async () => {
    await asUser(outsider,async()=>{
      await assert.rejects(db.query("select public.truper_create_project('Sin permiso','')"),/Forbidden/);
      await assert.rejects(db.query("update public.truper_profiles set role='superadmin',status='active' where id=$1",[outsider]),/permission denied/);
    });
  });
  await db.query("update public.truper_profiles set role='superadmin',status='active' where id=$1",[admin]);
  await asUser(admin,()=>db.query("select public.truper_manage_user($1,'analyst','active')",[analyst]));
  const project = await asUser(admin,async()=>(await db.query<{id:string}>("select public.truper_create_project('Facturación','Proceso de prueba') as id")).rows[0].id);
  await t.test('analista ajeno no lee ni modifica un proyecto', async () => {
    await asUser(analyst,async()=>{
      assert.equal((await db.query('select * from public.truper_projects')).rows.length,0);
      assert.equal((await db.query('select * from public.truper_profiles')).rows.length,1);
      await assert.rejects(db.query("select public.truper_import_sales($1,$2,'a.csv',$3)",[project,'20000000-0000-4000-8000-000000000001',JSON.stringify([{date:'2026-09-22',client:'A',region:'Centro',amountCents:123450}])]),/Forbidden/);
      await assert.rejects(db.query("select public.truper_manage_user($1,'superadmin','active')",[analyst]),/Forbidden/);
    });
  });
  await asUser(admin,()=>db.query("select public.truper_assign_member($1,$2,'viewer')",[project,analyst]));
  await t.test('consulta permite leer pero no importar', async () => {
    await asUser(analyst,async()=>{
      assert.equal((await db.query('select * from public.truper_projects')).rows.length,1);
      await assert.rejects(db.query("select public.truper_import_sales($1,$2,'a.csv','[]')",[project,'20000000-0000-4000-8000-000000000001']),/Forbidden/);
    });
  });
  await asUser(admin,()=>db.query("select public.truper_assign_member($1,$2,'editor')",[project,analyst]));
  const records = JSON.stringify([{date:'2026-09-22',client:'Cliente real de prueba',region:'Centro',amountCents:123450}]);
  let firstBatch = '';
  await t.test('la carga es atómica y los reintentos no duplican registros', async () => {
    await asUser(analyst,async()=>{
      const args=[project,'20000000-0000-4000-8000-000000000001','archivo.csv',records];
      firstBatch=(await db.query<{id:string}>('select public.truper_import_sales($1,$2,$3,$4) as id',args)).rows[0].id;
      const retry=(await db.query<{id:string}>('select public.truper_import_sales($1,$2,$3,$4) as id',args)).rows[0].id;
      assert.equal(retry,firstBatch);
      assert.equal((await db.query('select * from public.truper_sales_rows')).rows.length,1);
      assert.equal((await db.query<{active_batch_id:string}>('select active_batch_id from public.truper_projects')).rows[0].active_batch_id,firstBatch);
    });
  });
  await t.test('una fila inválida revierte toda la carga', async () => {
    await asUser(analyst,async()=>{
      const invalid=JSON.stringify([{date:'2026-09-22',client:'Válido',region:'Centro',amountCents:100},{date:'2026-09-22',client:'',region:'Centro',amountCents:100}]);
      await assert.rejects(db.query("select public.truper_import_sales($1,$2,'invalido.csv',$3)",[project,'20000000-0000-4000-8000-000000000002',invalid]),/check constraint/);
      assert.equal((await db.query('select * from public.truper_imports')).rows.length,1);
      assert.equal((await db.query('select * from public.truper_sales_rows')).rows.length,1);
    });
  });
  await t.test('la siguiente carga conserva el historial y activa solo la nueva versión', async () => {
    await asUser(analyst,async()=>{
      const batch=(await db.query<{id:string}>("select public.truper_import_sales($1,$2,'segunda.csv',$3) as id",[project,'20000000-0000-4000-8000-000000000003',records])).rows[0].id;
      assert.notEqual(batch,firstBatch);
      assert.equal((await db.query('select * from public.truper_imports')).rows.length,2);
      assert.equal((await db.query<{active_batch_id:string}>('select active_batch_id from public.truper_projects')).rows[0].active_batch_id,batch);
    });
  });
  await t.test('la suspensión retira el acceso incluso con sesión vigente', async () => {
    await asUser(admin,()=>db.query("select public.truper_manage_user($1,'analyst','suspended')",[analyst]));
    await asUser(analyst,async()=>{
      assert.equal((await db.query('select * from public.truper_projects')).rows.length,0);
      assert.equal((await db.query('select * from public.truper_sales_rows')).rows.length,0);
      await assert.rejects(db.query("select public.truper_import_sales($1,$2,'archivo.csv',$3)",[project,'20000000-0000-4000-8000-000000000004',records]),/Forbidden/);
    });
  });
  await t.test('auditoría inmutable y protección del propio superusuario',async()=>{
    await asUser(admin,async()=>{
      await assert.rejects(db.query("select public.truper_manage_user($1,'viewer','suspended')",[admin]),/Cannot modify your own access/);
      await assert.rejects(db.query('delete from public.truper_audit'),/permission denied/);
      assert.ok((await db.query('select * from public.truper_audit')).rows.length>=7);
    });
  });
  await db.close();
});
