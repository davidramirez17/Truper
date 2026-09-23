'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Bell,
  ChartNoAxesCombined,
  FolderKanban,
  Home,
  Plus,
} from 'lucide-react';

import type { WorkspaceView } from '@/modules/analytics/types';

type Props = {
  view: WorkspaceView;
  href: (path: string) => string;
  attention: number;
  onUpload: () => void;
};

const leftItems = [
  {
    view: 'overview' as const,
    href: '/',
    label: 'Inicio',
    icon: Home,
  },
  {
    view: 'projects' as const,
    href: '/proyectos',
    label: 'Proyectos',
    icon: FolderKanban,
  },
];

const rightItems = [
  {
    view: 'reports' as const,
    href: '/reportes',
    label: 'Reportes',
    icon: ChartNoAxesCombined,
  },
  {
    view: 'alerts' as const,
    href: '/alertas',
    label: 'Alertas',
    icon: Bell,
  },
];

export function MobileDock({
  view,
  href,
  attention,
  onUpload,
}: Props) {
  const isActive = (itemView: WorkspaceView) =>
    view === itemView ||
    (view === 'detail' && itemView === 'projects');

  const renderItem = (
    item: (typeof leftItems)[number] | (typeof rightItems)[number],
  ) => {
    const Icon = item.icon;
    const active = isActive(item.view);

    return (
      <Link
        key={item.view}
        href={href(item.href)}
        className={`mobile-dock-item ${active ? 'is-active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <span className="mobile-dock-icon">
          {active && (
            <motion.span
              layoutId="mobile-dock-active"
              className="mobile-dock-active"
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 38,
              }}
            />
          )}

          <Icon
            size={21}
            strokeWidth={active ? 2.25 : 1.8}
          />

          {item.view === 'alerts' && attention > 0 && (
            <span className="mobile-dock-badge">
              {attention > 9 ? '9+' : attention}
            </span>
          )}
        </span>

        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="mobile-dock-shell" aria-label="Navegación móvil">
      <div className="mobile-dock">
        <div className="mobile-dock-side">
          {leftItems.map(renderItem)}
        </div>

        <div className="mobile-dock-action-wrap">
          <motion.button
            type="button"
            className="mobile-dock-action"
            onClick={onUpload}
            whileTap={{ scale: 0.91 }}
            aria-label="Cargar o validar archivo"
          >
            <Plus size={26} strokeWidth={2.2} />
          </motion.button>

          <span className="mobile-dock-action-label">
            Cargar
          </span>
        </div>

        <div className="mobile-dock-side">
          {rightItems.map(renderItem)}
        </div>
      </div>
    </nav>
  );
}
