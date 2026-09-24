export type Role = 'superadmin' | 'admin' | 'analyst' | 'viewer';
export type ProfileStatus = 'pending' | 'active' | 'suspended';
export type Profile = { id: string; email: string; full_name: string; role: Role; status: ProfileStatus; created_at: string };
export const roleLabels: Record<Role, string> = { superadmin: 'Superusuario', admin: 'Administrador', analyst: 'Analista', viewer: 'Consulta' };
export const canCreateProjects = (role: Role) => role !== 'viewer';
export const isWorkspaceAdmin = (role: Role) => role === 'superadmin' || role === 'admin';
