import React from 'react';

export interface LifeTriangleBlockBadgeProps {
  /** Sequências detectadas exclusivamente no Triângulo da Vida (ex.: ["111", "444"]). */
  codigos?: string[];
  /** Fallback quando os códigos específicos não estiverem disponíveis. */
  fallbackCount?: number;
  className?: string;
}

/**
 * Tag compacta exibindo bloqueios exclusivamente do Triângulo da Vida.
 * Verde: "Nenhum bloqueio" | Vermelho: "Bloqueio: 111" (com as sequências).
 */
export function LifeTriangleBlockBadge({
  codigos,
  fallbackCount = 0,
  className = '',
}: LifeTriangleBlockBadgeProps) {
  const cleanCodigos = Array.isArray(codigos)
    ? Array.from(new Set(codigos.map((c) => c.trim()).filter(Boolean)))
    : [];

  const hasVidaBlock = cleanCodigos.length > 0;
  const hasUnknownBlock = codigos === undefined && fallbackCount > 0;
  const hasBlock = hasVidaBlock || hasUnknownBlock;

  const label = hasVidaBlock
    ? `Bloqueio: ${cleanCodigos.join(', ')}`
    : hasUnknownBlock
      ? 'Bloqueio'
      : 'Nenhum bloqueio';

  const toneClass = hasBlock
    ? 'bg-red-500/15 border-red-500/30 text-red-400'
    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';

  const tooltip = hasVidaBlock
    ? `Sequência no Triângulo da Vida: ${cleanCodigos.join(', ')}`
    : hasUnknownBlock
      ? 'Possui sequência de bloqueio'
      : 'Nenhuma sequência de bloqueio no Triângulo da Vida';

  return (
    <span
      title={tooltip}
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${toneClass} ${className}`}
    >
      {label}
    </span>
  );
}

export default LifeTriangleBlockBadge;
