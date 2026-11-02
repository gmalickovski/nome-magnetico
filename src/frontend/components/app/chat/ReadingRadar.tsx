import React, { useId } from 'react';
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
  /** Exibe deltas numéricos (+30, etc.) nas pontas quando há sobreposição */
  showNumericLabels?: boolean;
  className?: string;
}

/**
 * DEV-265: mesma escala e proporção da Estrela de Harmonização
 * (viewBox largo, raio ~190, rótulo 21px, número 24px, max-width 580px).
 * Rótulo + valor ficam empilhados FORA do pentágono; o valor fica sempre
 * do lado mais próximo do vértice, então nunca cruza linha nem texto.
 */
const VB_W = 800;
const VB_H = 640;
const CX = 400;
const CY = 320;
const RADIUS = 190;
const LINE_GAP = 32;

type Placement = 'top' | 'side' | 'bottom';

const AXIS_CONFIG: ReadonlyArray<{
  key: string;
  label: string;
  angle: number;
  anchor: 'middle' | 'start' | 'end';
  placement: Placement;
  offset: number;
  dx: number;
}> = [
  { key: 'expressao', label: 'Foco do Momento', angle: -Math.PI / 2, anchor: 'middle', placement: 'top', offset: 36, dx: 0 },
  { key: 'motivacao', label: 'Equilíbrio da Alma', angle: -Math.PI / 2 + (2 * Math.PI) / 5, anchor: 'start', placement: 'side', offset: 26, dx: 10 },
  { key: 'destino', label: 'Sintonia de Destino', angle: -Math.PI / 2 + (4 * Math.PI) / 5, anchor: 'start', placement: 'bottom', offset: 34, dx: 4 },
  { key: 'harmonia_triangulo', label: 'Magnetismo Social', angle: -Math.PI / 2 + (6 * Math.PI) / 5, anchor: 'end', placement: 'bottom', offset: 34, dx: -4 },
  { key: 'sequencias', label: 'Fluidez', angle: -Math.PI / 2 + (8 * Math.PI) / 5, anchor: 'end', placement: 'side', offset: 26, dx: -10 },
];

function getVal(axes: RadarAxesData, key: string): number {
  return axes[key as keyof RadarAxesData] ?? 0.35;
}

function getCoords(val: number, angle: number) {
  const safeVal = Math.max(0.08, Math.min(1.0, val));
  const r = RADIUS * safeVal;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
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
  const glowId = `radar-glow-${useId().replace(/:/g, '')}`;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const birthVisual = getScoreTierVisual(birthScore);
  const overlayVisual = overlayAxes && overlayScore != null ? getScoreTierVisual(overlayScore) : null;
  const showDelta = Boolean(showNumericLabels && overlayAxes && overlayVisual);

  const polygonPoints = (data: RadarAxesData) =>
    AXIS_CONFIG.map((axis) => {
      const { x, y } = getCoords(getVal(data, axis.key), axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

  const basePoints = polygonPoints(axes);
  const overlayPoints = overlayAxes ? polygonPoints(overlayAxes) : null;

  return (
    <div className={`w-full min-w-0 flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full max-w-[580px] h-auto overflow-visible"
        role="img"
        aria-label="Mapa de alinhamento vibracional cabalístico"
      >
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {rings.map((ringVal) => (
          <polygon
            key={`ring-${ringVal}`}
            points={AXIS_CONFIG.map((axis) => {
              const { x, y } = getCoords(ringVal, axis.angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.6"
          />
        ))}

        {AXIS_CONFIG.map((axis) => {
          const { x, y } = getCoords(1.0, axis.angle);
          return (
            <line key={`axis-${axis.key}`} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.6" />
          );
        })}

        <polygon
          points={basePoints}
          className="transition-all duration-300 ease-out"
          fill={birthVisual.fill}
          stroke={birthVisual.stroke}
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeOpacity="0.85"
        />

        {overlayPoints && overlayVisual && (
          <polygon
            points={overlayPoints}
            className="transition-all duration-300 ease-out"
            fill={overlayVisual.fill}
            stroke={overlayVisual.stroke}
            strokeWidth="3.4"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        )}

        {AXIS_CONFIG.map((axis) => {
          const { x, y } = getCoords(getVal(axes, axis.key), axis.angle);
          return <circle key={`dot-b-${axis.key}`} cx={x} cy={y} r="5" fill={birthVisual.stroke} />;
        })}

        {overlayAxes && overlayVisual &&
          AXIS_CONFIG.map((axis) => {
            const { x, y } = getCoords(getVal(overlayAxes, axis.key), axis.angle);
            return <circle key={`dot-o-${axis.key}`} cx={x} cy={y} r="7" fill={overlayVisual.stroke} />;
          })}

        {/* Rótulo + valor empilhados fora do pentágono (valor sempre visível nas 5 pontas) */}
        {AXIS_CONFIG.map((axis) => {
          const r = RADIUS + axis.offset;
          const gx = CX + r * Math.cos(axis.angle) + axis.dx;
          const gy = CY + r * Math.sin(axis.angle);
          const labelText = labels?.[axis.key] ?? axis.label;

          const base = Math.round(getVal(axes, axis.key) * 100);
          let valueText: string;
          let valueColor: string;
          if (showDelta && overlayAxes && overlayVisual) {
            const delta = Math.round(getVal(overlayAxes, axis.key) * 100) - base;
            if (delta > 0) {
              valueText = `+${delta}%`;
              valueColor = overlayVisual.text;
            } else if (delta < 0) {
              valueText = `${delta}%`;
              valueColor = '#ef4444'; // Vermelho para variação negativa
            } else {
              valueText = '0%';
              valueColor = '#f2ca50'; // Dourado quando não mudar (0%)
            }
          } else {
            valueText = `${base}%`;
            valueColor = '#f2ca50'; // Dourado para valores base
          }

          // Valor do lado do vértice; rótulo do lado de fora.
          let valueY = gy;
          let labelY = gy;
          if (axis.placement === 'top') {
            labelY = gy - LINE_GAP - 2;
          } else if (axis.placement === 'bottom') {
            labelY = gy + LINE_GAP;
          } else {
            labelY = gy - LINE_GAP / 2;
            valueY = gy + LINE_GAP / 2 + 2;
          }

          return (
            <g key={`lbl-${axis.key}`}>
              <text
                x={gx}
                y={labelY}
                textAnchor={axis.anchor}
                dominantBaseline="central"
                fill="#d0d5de"
                fontFamily="Inter, sans-serif"
                fontSize={25}
                fontWeight={700}
              >
                {labelText}
              </text>
              <text
                x={gx}
                y={valueY}
                textAnchor={axis.anchor}
                dominantBaseline="central"
                fill={valueColor}
                fontFamily="Inter, sans-serif"
                fontSize={28}
                fontWeight={800}
              >
                {valueText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ReadingRadar;
