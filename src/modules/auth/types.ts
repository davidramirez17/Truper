export type Role = 'superadmin' | 'admin' | 'analyst' | 'viewer';
export type ProfileStatus = 'pending' | 'active' | 'suspended';
export type Profile = { id: string; email: string; full_name: string; role: Role; status: ProfileStatus; created_at: string; area?: string | null; job_title?: string | null; avatar_url?: string | null; manager_id?: string | null };
export const roleLabels: Record<Role, string> = { superadmin: 'Superusuario', admin: 'Administrador', analyst: 'Analista', viewer: 'Consulta' };
export const roleDescriptions: Record<Role, string> = { superadmin: 'Administra usuarios, proyectos, permisos y configuración.', admin: 'Gestiona proyectos y datos de los espacios permitidos.', analyst: 'Consulta indicadores y puede actualizar proyectos asignados.', viewer: 'Consulta y exporta información asignada.' };
export const permissionLabels = { viewer: 'Consulta y exportación', editor: 'Consulta y actualización' } as const;
export const canCreateProjects = (role: Role) => role !== 'viewer';
export const isWorkspaceAdmin = (role: Role) => role === 'superadmin' || role === 'admin';
