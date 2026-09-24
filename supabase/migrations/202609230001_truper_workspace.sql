-- Additive, isolated schema. Does not modify legacy kpis_ventas or other applications.
begin;
create schema if not exists truper_private;
revoke all on schema truper_private from public, anon;
grant usage on schema truper_private to authenticated;

create table public.truper_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '' check (length(full_name) <= 100),
  role text not null default 'viewer' check (role in ('superadmin','admin','analyst','viewer')),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now()
);
create table public.truper_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  description text not null default '' check (length(description) <= 1000),
  module_key text not null default 'ventas' check (module_key = 'ventas'),
  owner_id uuid not null references public.truper_profiles(id),
  active_batch_id uuid,
  created_at timestamptz not null default now()
);
create table public.truper_project_members (
  project_id uuid not null references public.truper_projects(id) on delete cascade,
  user_id uuid not null references public.truper_profiles(id) on delete cascade,
  permission text not null check (permission in ('viewer','editor')),
  primary key (project_id,user_id)
);
create index truper_members_user_idx on public.truper_project_members(user_id);
create index truper_projects_owner_idx on public.truper_projects(owner_id);
create table public.truper_imports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.truper_projects(id),
  request_id uuid not null,
  filename text not null check (length(filename) between 1 and 255),
  row_count integer not null check (row_count between 1 and 10000),
  created_by uuid not null references public.truper_profiles(id),
  created_at timestamptz not null default now(),
  unique(project_id,request_id), unique(project_id,id)
);
alter table public.truper_projects add constraint truper_active_batch_fk foreign key(id,active_batch_id) references public.truper_imports(project_id,id);
create table public.truper_sales_rows (
  id bigint generated always as identity primary key,
  project_id uuid not null,
  batch_id uuid not null,
  row_number integer not null check (row_number between 1 and 10000),
  record_date date not null check (record_date between '1900-01-01' and '2200-12-31'),
  client text not null check (length(trim(client)) between 1 and 300),
  region text not null check (length(trim(region)) between 1 and 150),
  amount_cents bigint not null check (abs(amount_cents) <= 100000000000),
  foreign key(project_id,batch_id) references public.truper_imports(project_id,id),
  unique(batch_id,row_number)
);
create index truper_sales_project_date_idx on public.truper_sales_rows(project_id,record_date);
create table public.truper_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.truper_profiles(id),
  project_id uuid references public.truper_projects(id),
  action text not null,
  detail text not null,
  created_at timestamptz not null default now()
);
create index truper_audit_created_idx on public.truper_audit(created_at desc);

create function truper_private.handle_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.truper_profiles(id,email,full_name) values(new.id,coalesce(new.email,''),left(coalesce(new.raw_user_meta_data->>'full_name',''),100)) on conflict(id) do nothing;
  return new;
end $$;
create trigger truper_auth_user_created after insert on auth.users for each row execute function truper_private.handle_user();
insert into public.truper_profiles(id,email,full_name) select id,coalesce(email,''),left(coalesce(raw_user_meta_data->>'full_name',''),100) from auth.users on conflict(id) do nothing;

create function truper_private.current_role() returns text language sql stable security definer set search_path = '' as $$
  select role from public.truper_profiles where id=(select auth.uid()) and status='active';
$$;
create function truper_private.can_project(target uuid,write_access boolean default false) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(truper_private.current_role() is not null and (
    truper_private.current_role() in ('superadmin','admin') or
    exists(select 1 from public.truper_projects where id=target and owner_id=(select auth.uid())) or
    exists(select 1 from public.truper_project_members where project_id=target and user_id=(select auth.uid()) and (not write_access or permission='editor'))
  ),false);
$$;

alter table public.truper_profiles enable row level security;
alter table public.truper_projects enable row level security;
alter table public.truper_project_members enable row level security;
alter table public.truper_imports enable row level security;
alter table public.truper_sales_rows enable row level security;
alter table public.truper_audit enable row level security;
revoke all on public.truper_profiles,public.truper_projects,public.truper_project_members,public.truper_imports,public.truper_sales_rows,public.truper_audit from public,anon,authenticated;
grant select on public.truper_profiles,public.truper_projects,public.truper_project_members,public.truper_imports,public.truper_sales_rows,public.truper_audit to authenticated;
grant all on public.truper_profiles,public.truper_projects,public.truper_project_members,public.truper_imports,public.truper_sales_rows,public.truper_audit to service_role;
create policy truper_profile_read on public.truper_profiles for select to authenticated using(id=(select auth.uid()) or (select truper_private.current_role())='superadmin');
create policy truper_project_read on public.truper_projects for select to authenticated using(truper_private.can_project(id));
create policy truper_members_read on public.truper_project_members for select to authenticated using(truper_private.can_project(project_id));
create policy truper_import_read on public.truper_imports for select to authenticated using(truper_private.can_project(project_id));
create policy truper_sales_read on public.truper_sales_rows for select to authenticated using(truper_private.can_project(project_id));
create policy truper_audit_read on public.truper_audit for select to authenticated using((select truper_private.current_role())='superadmin' or truper_private.can_project(project_id));

create function truper_private.create_project(project_name text,project_description text) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if coalesce(truper_private.current_role(),'') not in ('superadmin','admin','analyst') then raise exception 'Forbidden' using errcode='42501'; end if;
  insert into public.truper_projects(name,description,owner_id) values(trim(project_name),trim(project_description),auth.uid()) returning id into result;
  insert into public.truper_audit(actor_id,project_id,action,detail) values(auth.uid(),result,'project.created','Proyecto creado');
  return result;
end $$;
create function public.truper_create_project(project_name text,project_description text default '') returns uuid language sql security invoker set search_path = '' as $$ select truper_private.create_project(project_name,project_description); $$;

create function truper_private.import_sales(target uuid,request_key uuid,file_name text,records jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare batch uuid; count_rows integer;
begin
  if not truper_private.can_project(target,true) then raise exception 'Forbidden' using errcode='42501'; end if;
  -- Serialize per-project replacements, retain earlier batches, and make retries idempotent.
  perform 1 from public.truper_projects where id=target for update;
  select id into batch from public.truper_imports where project_id=target and request_id=request_key;
  if batch is not null then return batch; end if;
  if jsonb_typeof(records) <> 'array' then raise exception 'Records must be an array'; end if;
  count_rows := jsonb_array_length(records);
  if count_rows not between 1 and 10000 then raise exception 'Invalid row count'; end if;
  if exists(select 1 from jsonb_array_elements(records) r where jsonb_typeof(r->'amountCents') <> 'number' or (r->>'amountCents') !~ '^-?[0-9]+$' or r->>'date' !~ '^\d{4}-\d{2}-\d{2}$') then raise exception 'Invalid record'; end if;
  insert into public.truper_imports(project_id,request_id,filename,row_count,created_by) values(target,request_key,file_name,count_rows,auth.uid()) returning id into batch;
  insert into public.truper_sales_rows(project_id,batch_id,row_number,record_date,client,region,amount_cents)
    select target,batch,ordinality::integer,(r->>'date')::date,r->>'client',r->>'region',(r->>'amountCents')::bigint from jsonb_array_elements(records) with ordinality as source(r,ordinality);
  update public.truper_projects set active_batch_id=batch where id=target;
  insert into public.truper_audit(actor_id,project_id,action,detail) values(auth.uid(),target,'import.completed',count_rows::text || ' registros importados');
  return batch;
end $$;
create function public.truper_import_sales(target uuid,request_key uuid,file_name text,records jsonb) returns uuid language sql security invoker set search_path = '' as $$ select truper_private.import_sales(target,request_key,file_name,records); $$;

create function truper_private.manage_user(target uuid,new_role text,new_status text) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('truper_user_access'));
  if coalesce(truper_private.current_role(),'') <> 'superadmin' then raise exception 'Forbidden' using errcode='42501'; end if;
  if target=auth.uid() then raise exception 'Cannot modify your own access'; end if;
  if not exists(select 1 from public.truper_profiles where id=target) then raise exception 'User not found'; end if;
  update public.truper_profiles set role=new_role,status=new_status where id=target;
  insert into public.truper_audit(actor_id,action,detail) values(auth.uid(),'user.access_changed','Acceso actualizado para usuario ' || target::text || ': ' || new_role || '/' || new_status);
end $$;
create function public.truper_manage_user(target uuid,new_role text,new_status text) returns void language sql security invoker set search_path = '' as $$ select truper_private.manage_user(target,new_role,new_status); $$;

create function truper_private.assign_member(target_project uuid,target_user uuid,access_level text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(truper_private.current_role(),'') <> 'superadmin' then raise exception 'Forbidden' using errcode='42501'; end if;
  if not exists(select 1 from public.truper_profiles where id=target_user and status='active') then raise exception 'User inactive'; end if;
  if access_level='none' then delete from public.truper_project_members where project_id=target_project and user_id=target_user;
  else insert into public.truper_project_members(project_id,user_id,permission) values(target_project,target_user,access_level) on conflict(project_id,user_id) do update set permission=excluded.permission; end if;
  insert into public.truper_audit(actor_id,project_id,action,detail) values(auth.uid(),target_project,'member.updated','Permiso ' || access_level || ' para ' || target_user::text);
end $$;
create function public.truper_assign_member(target_project uuid,target_user uuid,access_level text) returns void language sql security invoker set search_path = '' as $$ select truper_private.assign_member(target_project,target_user,access_level); $$;

revoke all on all functions in schema truper_private from public,anon;
grant execute on function truper_private.current_role(),truper_private.can_project(uuid,boolean),truper_private.create_project(text,text),truper_private.import_sales(uuid,uuid,text,jsonb),truper_private.manage_user(uuid,text,text),truper_private.assign_member(uuid,uuid,text) to authenticated;
revoke all on function public.truper_create_project(text,text),public.truper_import_sales(uuid,uuid,text,jsonb),public.truper_manage_user(uuid,text,text),public.truper_assign_member(uuid,uuid,text) from public,anon;
grant execute on function public.truper_create_project(text,text),public.truper_import_sales(uuid,uuid,text,jsonb),public.truper_manage_user(uuid,text,text),public.truper_assign_member(uuid,uuid,text) to authenticated;
commit;
