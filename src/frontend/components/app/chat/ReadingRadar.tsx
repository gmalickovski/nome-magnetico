import React from 'react';
import type { RadarAxesData } from './chat-types.js';

export interface ReadingRadarProps {
  axes: RadarAxesData;
  overlayAxes?: RadarAxesData | null;
  /** Notas 0–100 nos vértices — só após escolha de sugestão (spec). */
  showNumericLabels?: boolean;
  className?: string;
}

const AXIS_CONFIG = [
  { key: 'expressao', label: 'Expressão', angle: -Math.PI / 2, align: 'middle', dx: 0, dy: -6 },
  {
    key: 'motivacao',
    label: 'Motivação',
    angle: -Math.PI / 2 + (2 * Math.PI) / 5,
    align: 'start',
    dx: 4,
    dy: 0,
  },
  {
    key: 'destino',
    label: 'Destino',
    angle: -Math.PI / 2 + (4 * Math.PI) / 5,
    align: 'start',
    dx: 4,
    dy: 8,
  },
  {
    key: 'harmonia_triangulo',
    label: 'Harmonia',
    angle: -Math.PI / 2 + (6 * Math.PI) / 5,
    align: 'end',
    dx: -4,
    dy: 8,
  },
  {
    key: 'sequencias',
    label: 'Sequências',
    angle: -Math.PI / 2 + (8 * Math.PI) / 5,
    align: 'end',
    dx: -4,
    dy: 0,
  },
] as const;

function getVal(axes: RadarAxesData, key: string): number {
  return axes[key as keyof RadarAxesData] ?? 0.35;
}

export function ReadingRadar({
  axes,
  overlayAxes = null,
  showNumericLabels = false,
  className = '',
}: ReadingRadarProps) {
  const cx = 120;
  const cy = 100;
  const radius = 62;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getCoords = (val: number, angle: number) => {
    const safeVal = Math.max(0.08, Math.min(1.0, val));
    const r = radius * safeVal;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = (data: RadarAxesData) =>
    AXIS_CONFIG.map((axis) => {
      const val = getVal(data, axis.key);
      const { x, y } = getCoords(val, axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

  const basePoints = polygonPoints(axes);
  const overlayPoints = overlayAxes ? polygonPoints(overlayAxes) : null;

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 240 200"
        className="w-full max-w-[240px] h-auto overflow-visible"
        aria-label="Radar do motor numerológico"
      >
        {rings.map((ringVal) => {
          const ringPoints = AXIS_CONFIG.map((axis) => {
            const { x, y } = getCoords(ringVal, axis.angle);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={`ring-${ringVal}`}
              points={ringPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        {AXIS_CONFIG.map((axis) => {
          const { x, y } = getCoords(1.0, axis.angle);
          return (
            <line
              key={`axis-line-${axis.key}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={basePoints}
          className="transition-all duration-300 ease-out"
          fill="rgba(212, 175, 55, 0.28)"
          stroke="rgba(212, 175, 55, 0.55)"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />

        {overlayPoints && (
          <polygon
            points={overlayPoints}
            className="transition-all duration-300 ease-out"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />
        )}

        {AXIS_CONFIG.map((axis) => {
          const val = getVal(axes, axis.key);
          const { x, y } = getCoords(val, axis.angle);
          return (
            <circle
              key={`dot-base-${axis.key}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="rgba(212, 175, 55, 0.75)"
              className="transition-all duration-300 ease-out"
            />
          );
        })}

        {overlayAxes &&
          AXIS_CONFIG.map((axis) => {
            const val = getVal(overlayAxes, axis.key);
            const { x, y } = getCoords(val, axis.angle);
            return (
              <circle
                key={`dot-overlay-${axis.key}`}
                cx={x}
                cy={y}
                r="3"
                fill="#D4AF37"
                className="transition-all duration-300 ease-out"
              />
            );
          })}

        {AXIS_CONFIG.map((axis) => {
          const labelRadius = radius + 14;
          const lx = cx + labelRadius * Math.cos(axis.angle) + (axis.dx ?? 0);
          const ly = cy + labelRadius * Math.sin(axis.angle) + (axis.dy ?? 0);
          return (
            <text
              key={`label-${axis.key}`}
              x={lx}
              y={ly}
              textAnchor={axis.align as 'middle' | 'start' | 'end'}
              className="font-inter text-[10px] fill-chat-muted tracking-tight"
            >
              {axis.label}
            </text>
          );
        })}

        {showNumericLabels &&
          overlayAxes &&
          AXIS_CONFIG.map((axis) => {
            const base = Math.round(getVal(axes, axis.key) * 100);
            const over = Math.round(getVal(overlayAxes, axis.key) * 100);
            const delta = over - base;
            if (delta === 0) return null;
            const val = getVal(overlayAxes, axis.key);
            const { x, y } = getCoords(val, axis.angle);
            return (
              <text
                key={`delta-${axis.key}`}
                x={x}
                y={y - 6}
                textAnchor="middle"
                className="font-inter text-[9px] fill-[#D4AF37] font-medium"
              >
                {delta > 0 ? `+${delta}` : delta}
              </text>
            );
          })}
      </svg>
    </div>
  );
}

export default ReadingRadar;
