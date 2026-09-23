import { LayoutDashboard, FolderKanban, Database, ChartNoAxesCombined, Bell, Settings2 } from 'lucide-react';
import type { WorkspaceView } from '../analytics/types';

export const navigation = [
  { view: 'overview' as const, href: '/', label: 'Resumen general', icon: LayoutDashboard },
  { view: 'projects' as const, href: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { view: 'sources' as const, href: '/fuentes', label: 'Fuentes de datos', icon: Database },
  { view: 'reports' as const, href: '/reportes', label: 'Reportes', icon: ChartNoAxesCombined },
  { view: 'alerts' as const, href: '/alertas', label: 'Centro de alertas', icon: Bell },
];
export const settingsNav = { view: 'settings' as const, href: '/configuracion', label: 'Configuración', icon: Settings2 };
export const pageInfo: Record<WorkspaceView, { title: string; description: string; eyebrow: string }> = {
  overview: { title: 'El panorama completo.', description: 'Tus ventas, tus proyectos y lo que necesita tu atención.', eyebrow: 'TU OPERACIÓN, EN UN SOLO LUGAR' },
  projects: { title: 'Cada proyecto, bajo control.', description: 'Procesos independientes. Una misma forma de trabajar.', eyebrow: 'ESPACIO DE TRABAJO' },
  sources: { title: 'Buenos datos. Mejores decisiones.', description: 'Conoce el origen de tu información y revisa cada archivo.', eyebrow: 'FUENTES DE DATOS' },
  reports: { title: 'Del dato a la decisión.', description: 'Explora los movimientos y llévate justo la información que necesitas.', eyebrow: 'ANÁLISIS COMERCIAL' },
  alerts: { title: 'Enfócate en lo que importa.', description: 'Identifica pendientes y encuentra el siguiente paso para resolverlos.', eyebrow: 'CENTRO DE ALERTAS' },
  settings: { title: 'Un espacio a tu medida.', description: 'Personaliza tu experiencia y conoce lo que sigue para tu operación.', eyebrow: 'CONFIGURACIÓN' },
  detail: { title: '', description: '', eyebrow: 'DETALLE DEL PROYECTO' },
};
