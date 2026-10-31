import { useCallback, useRef, useState } from 'react';

const LONG_PRESS_MS = 400;
const HIDE_AFTER_RELEASE_MS = 1200;

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
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearHide();
    setVisible(true);
  }, [clearHide]);

  const scheduleHide = useCallback(() => {
    clearHide();
    const delay = prefersReducedMotion() ? 0 : HIDE_AFTER_RELEASE_MS;
    hideTimer.current = setTimeout(() => setVisible(false), delay);
  }, [clearHide]);

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
    if (visible) scheduleHide();
  }, [clearLongPress, visible, scheduleHide]);

  const onPointerCancel = useCallback(() => {
    clearLongPress();
    scheduleHide();
  }, [clearLongPress, scheduleHide]);

  const onMouseEnter = useCallback(() => {
    if (canHoverFinePointer()) show();
  }, [show]);

  const onMouseLeave = useCallback(() => {
    if (canHoverFinePointer()) scheduleHide();
  }, [scheduleHide]);

  return {
    visible,
    tooltipLabel,
    shouldSuppressClick,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onMouseEnter,
      onMouseLeave,
    },
  };
}
