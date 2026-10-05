import React, { useEffect, useRef, useState } from 'react';

interface ScoreLevel {
  bar: string;
  text: string;
  label: string;
}

function getScoreLevel(clamped: number): ScoreLevel {
  if (clamped >= 90) {
    return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400', label: 'Excelente' };
  }
  if (clamped >= 70) {
    return { bar: 'from-lime-500 to-lime-400', text: 'text-lime-400', label: 'Bom' };
  }
  if (clamped >= 40) {
    return { bar: 'from-yellow-500 to-yellow-400', text: 'text-yellow-400', label: 'Aceitável' };
  }
  if (clamped >= 20) {
    return { bar: 'from-orange-500 to-orange-400', text: 'text-orange-400', label: 'Não recomendado' };
  }
  return { bar: 'from-red-600 to-red-500', text: 'text-red-500', label: 'Crítico' };
}

interface ProductAnimatedScoreProps {
  score: number;
  play: boolean;
  durationMs?: number;
  size?: 'sm' | 'lg';
  delayMs?: number;
}

/**
 * Landing-only score bar with count-up + growing fill (800ms meditative default).
 */
export function ProductAnimatedScore({
  score,
  play,
  durationMs = 800,
  size = 'lg',
  delayMs = 0,
}: ProductAnimatedScoreProps) {
  const target = Math.max(0, Math.min(100, score));
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!play) {
      setDisplayed(0);
      setStarted(false);
      return;
    }

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setDisplayed(target);
      setStarted(true);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      setStarted(true);
      const startTime = performance.now();
      const from = 0;

      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min((now - startTime) / durationMs, 1);
        const eased = 1 - (1 - progress) * (1 - progress);
        setDisplayed(Math.round(from + (target - from) * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [play, target, durationMs, delayMs]);

  const level = getScoreLevel(started ? displayed : 0);
  const heights = size === 'sm' ? 'h-1.5' : 'h-3';
  const textSizes = size === 'sm' ? 'text-xs' : 'text-base';
  const numSizes = size === 'sm' ? 'text-lg' : 'text-3xl';
  const fill = started ? displayed : 0;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-1.5">
        <span className={`font-cinzel font-bold ${numSizes} ${level.text}`}>
          {fill}
          <span className={`${textSizes} font-inter font-normal text-gray-500 ml-0.5`}>/100</span>
        </span>
        <span className={`${textSizes} font-medium ${level.text}`}>{level.label}</span>
      </div>
      <div className={`w-full bg-white/10 rounded-full ${heights} overflow-hidden`}>
        <div
          className={`${heights} rounded-full bg-gradient-to-r ${level.bar}`}
          style={{
            width: `${fill}%`,
            transition: play ? 'none' : 'width 700ms ease-out',
          }}
        />
      </div>
    </div>
  );
}
