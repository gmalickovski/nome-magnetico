import React from 'react';

const GOLD = '#D4AF37';

interface FigureProps {
  label?: string;
  active?: boolean;
}

function FigureFrame({
  children,
  label,
  className = '',
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 72 52"
      className={`h-16 w-20 transition-all duration-700 ease-out ${className}`}
      role="img"
      aria-label={label}
      fill="none"
    >
      {children}
    </svg>
  );
}

/**
 * Passo 1: Formulário de Entrada
 * Prancheta com campos de dados, cursor e check de preenchimento.
 */
export function FormFigure({ active = true }: FigureProps) {
  return (
    <FigureFrame label="Formulário de dados pessoais" className={active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}>
      {/* Prancheta / Folha */}
      <rect
        x="12"
        y="6"
        width="48"
        height="40"
        rx="6"
        stroke={GOLD}
        strokeWidth="1.5"
        className="transition-all duration-700"
      />
      {/* Campo 1: Nome completo */}
      <path
        d="M20 16h24"
        stroke={GOLD}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Cursor pulsante */}
      <line
        x1="47"
        y1="13"
        x2="47"
        y2="19"
        stroke="#f2ca50"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Campo 2: Data de nascimento */}
      <path
        d="M20 26h18"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      {/* Campo 3: Intenção / Linhas secundárias */}
      <path
        d="M20 34h14"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Check de validação */}
      <circle cx="50" cy="30" r="5" stroke="#f2ca50" strokeWidth="1.25" fill="#131313" />
      <path
        d="M48 30l1.5 1.5 3-3"
        stroke="#f2ca50"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigureFrame>
  );
}

/**
 * Passo 2: Gerar Harmonização
 * Botão central de ativação com o triângulo cabalístico e feixes de energia.
 */
export function GenerateFigure({ active = true }: FigureProps) {
  return (
    <FigureFrame label="Ativação do cálculo de numerologia" className={active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}>
      {/* Botão em pílula */}
      <rect
        x="10"
        y="12"
        width="52"
        height="28"
        rx="14"
        stroke={GOLD}
        strokeWidth="1.5"
        className="transition-all duration-700"
      />
      {/* Triângulo cabalístico no centro */}
      <path
        d="M36 18 L44 32 L28 32 Z"
        stroke="#f2ca50"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Ponto central místico */}
      <circle cx="36" cy="27" r="1.5" fill="#f2ca50" />
      {/* Ondas / Feixes de irradiação */}
      <path
        d="M22 26h-4M50 26h4M36 10v-3"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      {/* Feixes diagonais sutis */}
      <path
        d="M25 15l-2-2M47 15l2-2"
        stroke={GOLD}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
    </FigureFrame>
  );
}

/**
 * Passo 3: Escolha do Nome & Sugestões
 * Lista de candidatos com score de harmonia e seleção interativa.
 */
export function ChooseFigure({ active = true }: FigureProps) {
  return (
    <FigureFrame label="Ranking de nomes e alternativas" className={active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}>
      {/* Item 1: Ouro / Indicado principal */}
      <rect
        x="8"
        y="8"
        width="56"
        height="14"
        rx="7"
        stroke="#f2ca50"
        strokeWidth="1.5"
        fill="#1a1810"
      />
      <circle cx="16" cy="15" r="3" stroke="#f2ca50" strokeWidth="1.25" />
      <path d="M24 15h26" stroke="#f2ca50" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M55 13l1 2 2 .3-1.6 1.4.5 2.1-1.9-1-1.9 1 .5-2.1L52 15.3l2-.3z" fill="#f2ca50" />

      {/* Item 2: Alternativa sugerida */}
      <g opacity="0.8">
        <rect
          x="12"
          y="26"
          width="48"
          height="10"
          rx="5"
          stroke={GOLD}
          strokeWidth="1.25"
        />
        <circle cx="18" cy="31" r="2" stroke={GOLD} strokeWidth="1" />
        <path d="M25 31h25" stroke={GOLD} strokeWidth="1.25" strokeLinecap="round" />
      </g>

      {/* Item 3: Outra opção */}
      <g opacity="0.5">
        <rect
          x="14"
          y="39"
          width="44"
          height="8"
          rx="4"
          stroke={GOLD}
          strokeWidth="1"
        />
        <path d="M24 43h24" stroke={GOLD} strokeWidth="1" strokeLinecap="round" />
      </g>
    </FigureFrame>
  );
}

/**
 * Passo 4: Relatório Completo & Download em PDF
 * Documento encadernado com selo cabalístico e seta de download/guia.
 */
export function DownloadFigure({ active = true }: FigureProps) {
  return (
    <FigureFrame label="Download do PDF e guia de assinatura" className={active ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}>
      {/* Folha com dobra no canto superior direito */}
      <path
        d="M18 44V10a2 2 0 0 1 2-2h22l12 12v24a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2z"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Dobra da página */}
      <path
        d="M42 8v12h12"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Linhas de conteúdo do relatório */}
      <path
        d="M26 22h10M26 28h18M26 34h14"
        stroke={GOLD}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Selo com seta de download */}
      <circle cx="48" cy="36" r="8" stroke="#f2ca50" strokeWidth="1.25" fill="#131313" />
      <path
        d="M48 32v6M45 35l3 3 3-3"
        stroke="#f2ca50"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigureFrame>
  );
}
