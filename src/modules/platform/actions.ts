'use server';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../auth/session';
import { canCreateProjects } from '../auth/types';
import { createProjectSchema, importSchema, manageUserSchema, memberSchema, updateMyProfileSchema, updateUserProfileSchema, type ActionResult } from './contracts';

export async function createProject(input: unknown): Promise<ActionResult<string>> {
  const { profile, client } = await requireSession();
  if (!canCreateProjects(profile.role)) return { ok: false, error: 'Tu rol no permite crear proyectos.' };
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Escribe un nombre de 2 a 100 caracteres y una descripción de hasta 1,000.' };
  const { data, error } = await client.rpc('truper_create_project', { project_name: parsed.data.name, project_description: parsed.data.description });
  if (error) return { ok: false, error: 'No se pudo crear el proyecto. Verifica tus permisos o vuelve a intentarlo.' };
  revalidatePath('/', 'layout'); return { ok: true, data: String(data) };
}
export async function importSales(input: unknown): Promise<ActionResult<string>> {
  const { client } = await requireSession();
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La carga contiene datos inválidos. Revisa fechas, importes, cliente y zona antes de continuar.' };
  const { projectId, requestId, filename, records } = parsed.data;
  const { data, error } = await client.rpc('truper_import_sales', { target: projectId, request_key: requestId, file_name: filename, records });
  if (error) return { ok: false, error: error.code === '42501' ? 'No tienes permiso para actualizar este proyecto.' : 'No se pudo confirmar la carga. Puedes reintentar: el identificador de esta operación evita duplicarla.' };
  revalidatePath('/', 'layout'); return { ok: true, data: String(data) };
}
export async function manageUser(input: unknown): Promise<ActionResult> {
  const { profile, client } = await requireSession();
  if (profile.role !== 'superadmin') return { ok: false, error: 'Solo el superusuario puede administrar accesos.' };
  const parsed = manageUserSchema.safeParse(input);
  if (!parsed.success || parsed.data.id === profile.id) return { ok: false, error: 'No puedes modificar tu propio acceso desde aquí.' };
  const { error } = await client.rpc('truper_manage_user', { target: parsed.data.id, new_role: parsed.data.role, new_status: parsed.data.status });
  if (error) return { ok: false, error: 'No se pudo actualizar el acceso. Inténtalo de nuevo.' };
  revalidatePath('/', 'layout'); return { ok: true, data: undefined };
}
export async function assignMember(input: unknown): Promise<ActionResult> {
  const { profile, client } = await requireSession();
  if (profile.role !== 'superadmin') return { ok: false, error: 'Solo el superusuario puede asignar accesos.' };
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Selecciona un proyecto, un usuario y un permiso válido.' };
  const { error } = await client.rpc('truper_assign_member', { target_project: parsed.data.projectId, target_user: parsed.data.userId, access_level: parsed.data.permission });
  if (error) return { ok: false, error: 'No se pudo asignar el permiso. El usuario debe estar activo.' };
  revalidatePath('/', 'layout'); return { ok: true, data: undefined };
}

export async function updateUserProfile(input: unknown): Promise<ActionResult> {
  const { profile, client } = await requireSession();
  if (profile.role !== 'superadmin') return { ok: false, error: 'Solo el superusuario puede editar el directorio.' };
  const parsed = updateUserProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa nombre, área, puesto, foto y responsable.' };
  const { id, fullName, area, jobTitle, avatarUrl, managerId } = parsed.data;
  if (id === managerId) return { ok: false, error: 'Una persona no puede ser su propio responsable.' };
  const { error } = await client.rpc('truper_update_user_profile', { target: id, new_full_name: fullName, new_area: area, new_job_title: jobTitle, new_avatar_url: avatarUrl, new_manager_id: managerId });
  if (error) return { ok: false, error: 'No se pudo guardar el perfil organizacional. Verifica que el responsable esté activo.' };
  revalidatePath('/', 'layout'); return { ok: true, data: undefined };
}

export async function updateMyProfile(input: unknown): Promise<ActionResult> {
  const { client } = await requireSession();
  const parsed = updateMyProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Escribe un nombre válido y una foto segura.' };
  const { error } = await client.rpc('truper_update_my_profile', { new_full_name: parsed.data.fullName, new_avatar_url: parsed.data.avatarUrl });
  if (error) return { ok: false, error: 'No se pudo actualizar tu perfil.' };
  revalidatePath('/', 'layout'); return { ok: true, data: undefined };
}
