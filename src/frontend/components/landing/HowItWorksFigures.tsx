import React from 'react';

const GOLD = '#D4AF37';

function FigureFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 64 48"
      className="h-12 w-16"
      role="img"
      aria-label={label}
      fill="none"
    >
      {children}
    </svg>
  );
}

/** Frequência: five bars. */
export function FrequencyFigure() {
  return (
    <FigureFrame label="Cinco barras">
      <path d="M8 36V22" stroke={GOLD} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M20 36V12" stroke={GOLD} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M32 36V18" stroke={GOLD} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M44 36V8" stroke={GOLD} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M56 36V16" stroke={GOLD} strokeWidth="1.75" strokeLinecap="round" />
    </FigureFrame>
  );
}

/** Bloqueios: four triangles, one interrupted. */
export function BlocksFigure() {
  return (
    <FigureFrame label="Quatro triângulos, um interrompido">
      <path d="M3 34 L9 16 L15 34 Z" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 34 L24 16 L30 34 Z" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M33 34 L39 16"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 34 L39 16"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M48 34 L54 16 L60 34 Z" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" />
    </FigureFrame>
  );
}

/** Ranking: three lines, indicated one marked. */
export function RankingFigure() {
  return (
    <FigureFrame label="Três linhas, a indicada marcada">
      <path d="M14 14h40" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 24h40" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="24" r="2.25" stroke={GOLD} strokeWidth="1.5" />
      <path d="M14 34h40" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
    </FigureFrame>
  );
}

/** Assinatura: a single stroke. */
export function SignatureFigure() {
  return (
    <FigureFrame label="Um traço">
      <path
        d="M6 30 C16 10, 24 38, 34 22 C40 12, 48 28, 58 20"
        stroke={GOLD}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigureFrame>
  );
}
