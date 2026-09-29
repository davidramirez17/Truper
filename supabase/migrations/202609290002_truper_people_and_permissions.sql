-- People directory, organization data, profile photos, and permission administration.
-- Additive migration: keeps existing projects, imports, history, and RLS contracts.
begin;

alter table public.truper_profiles
  add column if not exists area text not null default 'Sin definir' check (length(trim(area)) between 2 and 100),
  add column if not exists job_title text not null default 'Integrante' check (length(trim(job_title)) between 2 and 120),
  add column if not exists avatar_url text check (avatar_url is null or avatar_url ~ '^https?://'),
  add column if not exists manager_id uuid references public.truper_profiles(id) on delete set null;

create index if not exists truper_profiles_manager_idx on public.truper_profiles(manager_id);
create index if not exists truper_profiles_area_idx on public.truper_profiles(area);

create function truper_private.update_user_profile(
  target uuid,
  new_full_name text,
  new_area text,
  new_job_title text,
  new_avatar_url text,
  new_manager_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(truper_private.current_role(), '') <> 'superadmin' then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if not exists(select 1 from public.truper_profiles where id = target) then
    raise exception 'User not found';
  end if;
  if length(trim(new_full_name)) not between 2 and 100 then raise exception 'Invalid full name'; end if;
  if length(trim(new_area)) not between 2 and 100 then raise exception 'Invalid area'; end if;
  if length(trim(new_job_title)) not between 2 and 120 then raise exception 'Invalid job title'; end if;
  if new_avatar_url is not null and new_avatar_url !~ '^https?://' then raise exception 'Invalid avatar URL'; end if;
  if new_manager_id = target then raise exception 'A user cannot manage itself'; end if;
  if new_manager_id is not null and not exists(select 1 from public.truper_profiles where id = new_manager_id and status = 'active') then
    raise exception 'Manager must be active';
  end if;
  update public.truper_profiles
    set full_name = trim(new_full_name), area = trim(new_area), job_title = trim(new_job_title), avatar_url = new_avatar_url, manager_id = new_manager_id
    where id = target;
  insert into public.truper_audit(actor_id, action, detail)
    values(auth.uid(), 'user.profile_updated', 'Perfil actualizado para usuario ' || target::text);
end;
$$;

create function public.truper_update_user_profile(
  target uuid,
  new_full_name text,
  new_area text,
  new_job_title text,
  new_avatar_url text,
  new_manager_id uuid
) returns void
language sql
security invoker
set search_path = ''
as $$ select truper_private.update_user_profile(target, new_full_name, new_area, new_job_title, new_avatar_url, new_manager_id); $$;

create function truper_private.update_my_profile(new_full_name text, new_avatar_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if truper_private.current_role() is null then raise exception 'Forbidden' using errcode = '42501'; end if;
  if length(trim(new_full_name)) not between 2 and 100 then raise exception 'Invalid full name'; end if;
  if new_avatar_url is not null and new_avatar_url !~ '^https?://' then raise exception 'Invalid avatar URL'; end if;
  update public.truper_profiles set full_name = trim(new_full_name), avatar_url = new_avatar_url where id = auth.uid();
  insert into public.truper_audit(actor_id, action, detail) values(auth.uid(), 'user.profile_updated', 'Perfil propio actualizado');
end;
$$;

create function public.truper_update_my_profile(new_full_name text, new_avatar_url text)
returns void
language sql
security invoker
set search_path = ''
as $$ select truper_private.update_my_profile(new_full_name, new_avatar_url); $$;

revoke all on function truper_private.update_user_profile(uuid,text,text,text,text,uuid) from public, anon;
revoke all on function truper_private.update_my_profile(text,text) from public, anon;
grant execute on function truper_private.update_user_profile(uuid,text,text,text,text,uuid), truper_private.update_my_profile(text,text) to authenticated;
revoke all on function public.truper_update_user_profile(uuid,text,text,text,text,uuid), public.truper_update_my_profile(text,text) from public, anon;
grant execute on function public.truper_update_user_profile(uuid,text,text,text,text,uuid), public.truper_update_my_profile(text,text) to authenticated;

-- Supabase projects include storage.objects. The guard keeps local PGlite tests portable.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
      values('truper-avatars', 'truper-avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
      on conflict(id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    execute 'drop policy if exists truper_avatar_insert on storage.objects';
    execute 'drop policy if exists truper_avatar_update on storage.objects';
    execute 'drop policy if exists truper_avatar_delete on storage.objects';
    execute $policy$create policy truper_avatar_insert on storage.objects for insert to authenticated with check (bucket_id = 'truper-avatars' and ((select truper_private.current_role()) = 'superadmin' or (storage.foldername(name))[1] = (select auth.uid())::text))$policy$;
    execute $policy$create policy truper_avatar_update on storage.objects for update to authenticated using (bucket_id = 'truper-avatars' and ((select truper_private.current_role()) = 'superadmin' or (storage.foldername(name))[1] = (select auth.uid())::text)) with check (bucket_id = 'truper-avatars' and ((select truper_private.current_role()) = 'superadmin' or (storage.foldername(name))[1] = (select auth.uid())::text))$policy$;
    execute $policy$create policy truper_avatar_delete on storage.objects for delete to authenticated using (bucket_id = 'truper-avatars' and ((select truper_private.current_role()) = 'superadmin' or (storage.foldername(name))[1] = (select auth.uid())::text))$policy$;
  end if;
end;
$$;

commit;
