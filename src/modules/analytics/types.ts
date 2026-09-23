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
};

export type Period = 7 | 14 | 30;
export type WorkspaceView = 'overview' | 'projects' | 'sources' | 'reports' | 'alerts' | 'settings' | 'detail';
