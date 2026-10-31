import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!tip.visible || !buttonRef.current) {
      setTipPos(null);
      return;
    }
    const update = () => {
      const el = buttonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setTipPos({ left: r.left + r.width / 2, top: r.top });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [tip.visible]);

  const tooltipNode =
    tip.visible && tipPos && typeof document !== 'undefined'
      ? createPortal(
          <span
            role="tooltip"
            className="mobile-chat-dock-tooltip mobile-chat-dock-tooltip--portal pointer-events-none fixed z-[100]"
            style={{
              left: tipPos.left,
              top: tipPos.top - 10,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {tip.tooltipLabel}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      {tooltipNode}
      <button
        ref={buttonRef}
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
    </>
  );
}
