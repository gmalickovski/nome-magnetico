import React from 'react';
import type { RadarAxesData } from './chat-types.js';

export interface ReadingRadarProps {
  axes: RadarAxesData;
  className?: string;
}

const AXIS_CONFIG = [
  { key: 'momento', label: 'Momento', angle: -Math.PI / 2, align: 'middle', dy: -6 },
  { key: 'objetivo', label: 'Objetivo', angle: -Math.PI / 2 + (2 * Math.PI) / 5, align: 'start', dx: 4, dy: 0 },
  { key: 'uso', label: 'Uso', angle: -Math.PI / 2 + (4 * Math.PI) / 5, align: 'start', dx: 4, dy: 8 },
  { key: 'apego_sobrenome', label: 'Sobrenome', angle: -Math.PI / 2 + (6 * Math.PI) / 5, align: 'end', dx: -4, dy: 8 },
  { key: 'urgencia', label: 'Urgência', angle: -Math.PI / 2 + (8 * Math.PI) / 5, align: 'end', dx: -4, dy: 0 },
] as const;

export function ReadingRadar({ axes, className = '' }: ReadingRadarProps) {
  const cx = 120;
  const cy = 100;
  const radius = 62;
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Helper para calcular coordenadas polares
  const getCoords = (val: number, angle: number) => {
    // Normaliza para o raio mínimo visual de 0.15 para não colapsar o ponto no centro
    const safeVal = Math.max(0.15, Math.min(1.0, val));
    const r = radius * safeVal;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Pontos do polígono preenchido do radar
  const polygonPoints = AXIS_CONFIG.map((axis) => {
    const val = axes[axis.key as keyof RadarAxesData] ?? 0.3;
    const { x, y } = getCoords(val, axis.angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 240 200"
        className="w-full max-w-[240px] h-auto overflow-visible"
        aria-label="Radar de leitura das dimensões do consulente"
      >
        {/* Anéis concêntricos de fundo */}
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

        {/* Eixos radiais do centro até o perímetro */}
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

        {/* Polígono dourado dos dados do consulente */}
        <polygon
          points={polygonPoints}
          className="transition-all duration-300 ease-out"
          fill="rgba(212, 175, 55, 0.22)"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Vértices dourados nos pontos */}
        {AXIS_CONFIG.map((axis) => {
          const val = axes[axis.key as keyof RadarAxesData] ?? 0.3;
          const { x, y } = getCoords(val, axis.angle);
          return (
            <circle
              key={`dot-${axis.key}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="#D4AF37"
              className="transition-all duration-300 ease-out"
            />
          );
        })}

        {/* Legendas dos 5 eixos */}
        {AXIS_CONFIG.map((axis) => {
          const labelRadius = radius + 14;
          const lx = cx + labelRadius * Math.cos(axis.angle) + (axis.dx ?? 0);
          const ly = cy + labelRadius * Math.sin(axis.angle) + (axis.dy ?? 0);
          return (
            <text
              key={`label-${axis.key}`}
              x={lx}
              y={ly}
              textAnchor={axis.align as any}
              className="font-inter text-[10px] fill-chat-muted tracking-tight"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default ReadingRadar;
