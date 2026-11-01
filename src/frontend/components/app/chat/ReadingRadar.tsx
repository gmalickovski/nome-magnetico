import React from 'react';
import type { RadarAxesData } from './chat-types.js';
import { getScoreTierVisual } from '../../landing/score-tier-visual.js';

export interface ReadingRadarProps {
  axes: RadarAxesData;
  overlayAxes?: RadarAxesData | null;
  /** Score do nome de nascimento (define a cor da linha e preenchimento base) */
  birthScore?: number;
  /** Score da sugestão selecionada (define a cor da linha e preenchimento de sobreposição) */
  overlayScore?: number | null;
  /** Rótulos dinâmicos dos eixos (ex.: Foco: Carreira) */
  labels?: Record<string, string>;
  /** Exibe deltas numéricos (+30, etc.) nas pontas ativas */
  showNumericLabels?: boolean;
  className?: string;
}

const AXIS_CONFIG = [
  { key: 'expressao', label: 'Foco do Momento', angle: -Math.PI / 2, align: 'middle', dx: 0, dy: -6 },
  {
    key: 'motivacao',
    label: 'Equilíbrio da Alma',
    angle: -Math.PI / 2 + (2 * Math.PI) / 5,
    align: 'start',
    dx: 6,
    dy: 0,
  },
  {
    key: 'destino',
    label: 'Sintonia de Destino',
    angle: -Math.PI / 2 + (4 * Math.PI) / 5,
    align: 'start',
    dx: 4,
    dy: 8,
  },
  {
    key: 'harmonia_triangulo',
    label: 'Magnetismo Social',
    angle: -Math.PI / 2 + (6 * Math.PI) / 5,
    align: 'end',
    dx: -4,
    dy: 8,
  },
  {
    key: 'sequencias',
    label: 'Fluidez',
    angle: -Math.PI / 2 + (8 * Math.PI) / 5,
    align: 'end',
    dx: -6,
    dy: 0,
  },
] as const;

function getVal(axes: RadarAxesData, key: string): number {
  return axes[key as keyof RadarAxesData] ?? 0.35;
}

export function ReadingRadar({
  axes,
  overlayAxes = null,
  birthScore = 60,
  overlayScore = null,
  labels,
  showNumericLabels = false,
  className = '',
}: ReadingRadarProps) {
  const cx = 120;
  const cy = 100;
  const radius = 62;
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Cores sincronizadas com o Score Tier Visual (N1 a N5)
  const birthVisual = getScoreTierVisual(birthScore);
  const overlayVisual = overlayScore != null ? getScoreTierVisual(overlayScore) : null;

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
        viewBox="0 0 250 210"
        className="w-full max-w-[260px] h-auto overflow-visible"
        aria-label="Mapa de alinhamento vibracional cabalístico"
      >
        <defs>
          {overlayVisual && (
            <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Anéis de teia */}
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

        {/* Linhas radiais dos 5 eixos */}
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

        {/* Polígono Base: Nome de Nascimento (cor sincronizada com o nível do score) */}
        <polygon
          points={basePoints}
          className="transition-all duration-300 ease-out"
          fill={birthVisual.fill}
          stroke={birthVisual.stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeOpacity="0.85"
        />

        {/* Polígono de Sobreposição: Nome Harmonizado (cor sincronizada com o nível do score) */}
        {overlayPoints && overlayVisual && (
          <polygon
            points={overlayPoints}
            className="transition-all duration-300 ease-out"
            fill={overlayVisual.fill}
            stroke={overlayVisual.stroke}
            strokeWidth="2.25"
            strokeLinejoin="round"
            filter="url(#radar-glow)"
          />
        )}

        {/* Vértices do polígono base */}
        {AXIS_CONFIG.map((axis) => {
          const val = getVal(axes, axis.key);
          const { x, y } = getCoords(val, axis.angle);
          return (
            <circle
              key={`dot-base-${axis.key}`}
              cx={x}
              cy={y}
              r="2.5"
              fill={birthVisual.stroke}
              className="transition-all duration-300 ease-out"
            />
          );
        })}

        {/* Vértices do polígono harmonizado */}
        {overlayAxes && overlayVisual &&
          AXIS_CONFIG.map((axis) => {
            const val = getVal(overlayAxes, axis.key);
            const { x, y } = getCoords(val, axis.angle);
            return (
              <circle
                key={`dot-overlay-${axis.key}`}
                cx={x}
                cy={y}
                r="3.5"
                fill={overlayVisual.stroke}
                className="transition-all duration-300 ease-out"
              />
            );
          })}

        {/* Rótulos dos eixos */}
        {AXIS_CONFIG.map((axis) => {
          const labelRadius = radius + 15;
          const lx = cx + labelRadius * Math.cos(axis.angle) + (axis.dx ?? 0);
          const ly = cy + labelRadius * Math.sin(axis.angle) + (axis.dy ?? 0);
          const labelText = labels?.[axis.key] ?? axis.label;

          return (
            <text
              key={`label-${axis.key}`}
              x={lx}
              y={ly}
              textAnchor={axis.align as 'middle' | 'start' | 'end'}
              className="font-inter text-[9.5px] font-medium tracking-tight fill-[#A0A0A0]"
            >
              {labelText}
            </text>
          );
        })}

        {/* Variações numéricas nos vértices (+delta) */}
        {showNumericLabels &&
          overlayAxes &&
          overlayVisual &&
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
                y={y - 7}
                textAnchor="middle"
                className="font-inter text-[9px] font-bold"
                style={{ fill: overlayVisual.stroke }}
              >
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </text>
            );
          })}
      </svg>
    </div>
  );
}

export default ReadingRadar;
