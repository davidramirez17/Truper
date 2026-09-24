import type { Profile } from '../auth/types';
export type ImportBatch = { id: string; project_id: string; filename: string; row_count: number; created_at: string; created_by: string };
export type AuditEntry = { id: number; actor_id: string | null; project_id: string | null; action: string; detail: string; created_at: string };
export type ProjectMember = { project_id: string; user_id: string; permission: 'viewer' | 'editor' };
export type ProjectStatus = 'ready' | 'attention' | 'unconfigured' | 'planned';
export type Project = {
  id: string;
  name: string;
  description: string;
  initials: string;
  color: 'orange' | 'blue' | 'purple';
  status: ProjectStatus;
  source: string;
  owner: string;
  updatedAt: string | null;
  message?: string;
  canEdit?: boolean;
  activeBatchId?: string | null;
};

export type SalesRecord = {
  id: string;
  projectId: string;
  date: string;
  client: string;
  region: string;
  amountCents: number;
};

export type DataAlert = {
  id: string;
  projectId: string;
  severity: 'warning' | 'info' | 'error';
  title: string;
  message: string;
};

export type WorkspaceData = {
  mode: 'demo' | 'real' | 'local';
  asOf: string;
  projects: Project[];
  records: SalesRecord[];
  alerts: DataAlert[];
  snapshot?: { amountCents: number; weekly: string; date: string };
  profile?: Profile;
  users?: Profile[];
  imports?: ImportBatch[];
  members?: ProjectMember[];
  activity?: AuditEntry[];
  connectionError?: string;
};

export type Period = 7 | 14 | 30;
export type WorkspaceView = 'overview' | 'projects' | 'sources' | 'reports' | 'alerts' | 'settings' | 'detail' | 'users' | 'history' | 'design' | 'activity';
