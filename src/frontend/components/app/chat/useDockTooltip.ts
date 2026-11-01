import { useCallback, useRef, useState } from 'react';

const LONG_PRESS_MS = 400;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canHoverFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function useDockTooltip(tooltipLabel: string) {
  const [visible, setVisible] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearLongPress();
    setVisible(false);
  }, [clearLongPress]);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const shouldSuppressClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      suppressClickRef.current = false;
      clearLongPress();
      if (e.pointerType === 'touch') {
        longPressTimer.current = setTimeout(() => {
          suppressClickRef.current = true;
          show();
        }, prefersReducedMotion() ? 0 : LONG_PRESS_MS);
      }
    },
    [clearLongPress, show]
  );

  const onPointerUp = useCallback(() => {
    clearLongPress();
    hide();
  }, [clearLongPress, hide]);

  const onPointerLeave = useCallback(() => {
    hide();
  }, [hide]);

  const onPointerCancel = useCallback(() => {
    hide();
  }, [hide]);

  const onMouseEnter = useCallback(() => {
    if (canHoverFinePointer()) show();
  }, [show]);

  const onMouseLeave = useCallback(() => {
    if (canHoverFinePointer()) hide();
  }, [hide]);

  const onTouchEnd = useCallback(() => {
    hide();
  }, [hide]);

  const onTouchCancel = useCallback(() => {
    hide();
  }, [hide]);

  return {
    visible,
    tooltipLabel,
    shouldSuppressClick,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onMouseEnter,
      onMouseLeave,
      onTouchEnd,
      onTouchCancel,
    },
  };
}
