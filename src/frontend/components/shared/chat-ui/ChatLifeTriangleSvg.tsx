const BLOQUEIO_SEQUENCIAS = ['111', '222', '333', '444', '555', '666', '777', '888', '999'];

/**
 * Constrói um Set de posições "linha,coluna" que pertencem a alguma sequência negativa.
 * Mesma lógica de `TriangleVisualization.tsx` / `formula.js`.
 */
export function buildLifeTriangleBloqueioPositions(
  linhas: ReadonlyArray<ReadonlyArray<number>>,
): Set<string> {
  const positions = new Set<string>();
  for (let r = 0; r < linhas.length; r++) {
    const linha = linhas[r]!;
    for (let i = 0; i <= linha.length - 3; i++) {
      const tripla = `${linha[i]}${linha[i + 1]}${linha[i + 2]}`;
      if (BLOQUEIO_SEQUENCIAS.includes(tripla)) {
        for (let k = i; k < i + 3; k++) positions.add(`${r},${k}`);
        const digit = String(linha[i]);
        let skip = i + 3;
        while (skip < linha.length && String(linha[skip]) === digit) skip++;
        i = skip - 1;
      }
    }
  }
  return positions;
}

export interface ChatLifeTriangleSvgProps {
  nome: string;
  linhas: ReadonlyArray<ReadonlyArray<number>>;
  /** Quantidade de linhas numéricas visíveis (padrão: todas). */
  visibleRows?: number;
  /** Destaca sequências >= 3 repetidas em vermelho (padrão: true). */
  highlightBlocks?: boolean;
  /** Destaca o número da ponta (Arcano Regente) em roxo (padrão: true). */
  highlightApex?: boolean;
  /** Largura mínima em px dentro do container (padrão: 280). */
  minWidthPx?: number;
  /**
   * Só nos mockups da landing: transição suave (ms) para linhas, bloqueios e ponta.
   * Quando informado, os destaques ficam sempre no DOM e entram/saem por opacidade.
   */
  softTransitionMs?: number;
  className?: string;
}

/**
 * SVG compartilhado do Triângulo da Vida usado em `TriangleVisualization` (app real)
 * e na `TriangleScene` (mockup da landing).
 */
export function ChatLifeTriangleSvg({
  nome,
  linhas,
  visibleRows,
  highlightBlocks = true,
  highlightApex = true,
  minWidthPx = 280,
  softTransitionMs,
  className = '',
}: ChatLifeTriangleSvgProps) {
  const soft = typeof softTransitionMs === 'number';
  const ease = soft ? `${softTransitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)` : '';
  const nomeSemEspacos = nome.replace(/\s+/g, '').toUpperCase();
  const letras = nomeSemEspacos.split('');
  const N = linhas[0]?.length ?? 1;

  const ELEM = 50;
  const textWidth = (N - 1) * ELEM;
  const largura = textWidth + 120;
  const altura = 80 + linhas.length * 30;
  const viewBox = `0 0 ${largura} ${altura}`;

  const midX = largura / 2;
  const allBloqueioPos = buildLifeTriangleBloqueioPositions(linhas);
  const bloqueioPos = highlightBlocks ? allBloqueioPos : new Set<string>();
  const xBase = midX - textWidth / 2;
  const rowLimit = visibleRows !== undefined ? Math.max(0, visibleRows) : linhas.length;

  return (
    <div
      className={`overflow-x-auto py-2 flex justify-center w-full touch-scroll-container ${className}`}
    >
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: `${largura}px`,
          minWidth: `${Math.min(largura, minWidthPx)}px`,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {letras.map((letra, idx) => (
          <text
            key={`letter-${idx}`}
            x={xBase + idx * ELEM}
            y={28}
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
            fill="#D4AF37"
            fontFamily="Cinzel, Georgia, 'Times New Roman', serif"
          >
            {letra}
          </text>
        ))}

        {linhas.map((linha, r) => {
          const yNum = 55 + r * 30;
          const xRowStart = midX - ((linha.length - 1) * ELEM) / 2;
          const isLastRow = r === linhas.length - 1;
          const rowVisible = r < rowLimit;

          return linha.map((num, c) => {
            const x = xRowStart + c * ELEM;
            const key = `${r},${c}`;
            const isBloq = bloqueioPos.has(key);
            const showApex = isLastRow && highlightApex && !isBloq;
            const couldBloq = soft && allBloqueioPos.has(key);
            const couldApex = soft && isLastRow && !allBloqueioPos.has(key);

            const fill = isBloq
              ? '#FF6B6B'
              : showApex
                ? '#c084fc'
                : r === 0
                  ? '#fbbf24'
                  : '#9ca3af';

            return (
              <g
                key={key}
                style={
                  visibleRows !== undefined
                    ? {
                        opacity: rowVisible ? 1 : 0,
                        transition: soft ? `opacity ${ease}` : 'opacity 320ms ease-out',
                      }
                    : undefined
                }
              >
                {(soft ? couldBloq : isBloq) && (
                  <rect
                    style={soft ? { opacity: isBloq ? 1 : 0, transition: `opacity ${ease}` } : undefined}
                    x={x - 13}
                    y={yNum - 14}
                    width="26"
                    height="20"
                    rx="4"
                    fill="rgba(239,68,68,0.20)"
                    stroke="rgba(239,68,68,0.55)"
                    strokeWidth="1"
                  />
                )}
                {(soft ? couldApex : showApex) && (
                  <circle
                    style={soft ? { opacity: showApex ? 1 : 0, transition: `opacity ${ease}` } : undefined}
                    cx={x}
                    cy={yNum - 5}
                    r="13"
                    fill="rgba(192,132,252,0.15)"
                    stroke="rgba(192,132,252,0.40)"
                    strokeWidth="1"
                  />
                )}
                <text
                  x={x}
                  y={yNum}
                  fontSize={showApex ? '17' : '14'}
                  fontWeight={isBloq || showApex ? '700' : '400'}
                  textAnchor="middle"
                  fill={fill}
                  style={soft ? { transition: `fill ${ease}` } : undefined}
                  fontFamily="'Courier New', Courier, monospace"
                >
                  {num}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}
