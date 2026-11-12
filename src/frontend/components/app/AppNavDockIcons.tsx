import React from 'react';
import type { AppNavItemId } from './app-mobile-nav.js';

type IconProps = { className?: string };

const STROKE = 1.5;

/** Lucide LayoutDashboard */
export function IconInicio({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" strokeWidth={STROKE} />
      <rect x="14" y="3" width="7" height="5" rx="1" strokeWidth={STROKE} />
      <rect x="14" y="12" width="7" height="9" rx="1" strokeWidth={STROKE} />
      <rect x="3" y="16" width="7" height="5" rx="1" strokeWidth={STROKE} />
    </svg>
  );
}

/** Lucide FileText */
export function IconAnalises({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      />
      <path strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path strokeWidth={STROKE} strokeLinecap="round" d="M10 9H8" />
      <path strokeWidth={STROKE} strokeLinecap="round" d="M16 13H8" />
      <path strokeWidth={STROKE} strokeLinecap="round" d="M16 17H8" />
    </svg>
  );
}

/** Lucide BookOpen */
export function IconGlossario({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7v14"
      />
      <path
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      />
    </svg>
  );
}

/** Lucide LifeBuoy */
export function IconSuporte({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" strokeWidth={STROKE} />
      <path strokeWidth={STROKE} d="m4.93 4.93 4.24 4.24" />
      <path strokeWidth={STROKE} d="m14.83 9.17 4.24-4.24" />
      <path strokeWidth={STROKE} d="m14.83 14.83 4.24 4.24" />
      <path strokeWidth={STROKE} d="m9.17 14.83-4.24 4.24" />
      <circle cx="12" cy="12" r="4" strokeWidth={STROKE} />
    </svg>
  );
}

export function iconForNavItem(id: AppNavItemId): React.FC<IconProps> {
  switch (id) {
    case 'inicio':
      return IconInicio;
    case 'analises':
      return IconAnalises;
    case 'glossario':
      return IconGlossario;
    case 'suporte':
      return IconSuporte;
    default:
      return IconInicio;
  }
}
