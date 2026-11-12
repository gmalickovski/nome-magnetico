import React, { forwardRef } from 'react';
import { MOBILE_DOCK_ROOT_CLASS } from './mobile-dock-layout.js';

export interface MobileDockRootProps {
  children: React.ReactNode;
  /** toolbar (chat) | navigation (app nav) */
  role: 'toolbar' | 'navigation';
  'aria-label': string;
  className?: string;
}

/** Único contêiner fixo da dock mobile — uma instância por página via AppMobileDock. */
export const MobileDockRoot = forwardRef<HTMLDivElement, MobileDockRootProps>(function MobileDockRoot(
  { children, role, 'aria-label': ariaLabel, className = '' },
  ref
) {
  return (
    <div
      ref={ref}
      data-nm-mobile-dock="single"
      className={`${MOBILE_DOCK_ROOT_CLASS} nm-app-mobile-dock ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
});

export default MobileDockRoot;
