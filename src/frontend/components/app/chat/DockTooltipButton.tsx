import React from 'react';
import { useDockTooltip } from './useDockTooltip.js';

export interface DockTooltipButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  children: React.ReactNode;
}

export function DockTooltipButton({
  tooltip,
  children,
  onClick,
  className = '',
  ...rest
}: DockTooltipButtonProps) {
  const tip = useDockTooltip(tooltip);

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      {tip.visible && (
        <span
          role="tooltip"
          className="mobile-chat-dock-tooltip pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1a1a1a]/95 px-2.5 py-1 text-[11px] font-medium text-[#e5e2e1] shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
        >
          {tip.tooltipLabel}
        </span>
      )}
      <button
        type="button"
        {...rest}
        {...tip.handlers}
        className={className}
        onClick={(e) => {
          if (tip.shouldSuppressClick()) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          onClick?.(e);
        }}
      >
        {children}
      </button>
    </div>
  );
}
