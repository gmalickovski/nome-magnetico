import React from 'react';
import { landingMockupFloatClass } from './LandingSectionIntro';

const GOLD = '#D4AF37';
const GOLD_LIGHT = '#f2ca50';

interface MockupProps {
  className?: string;
}

/**
 * Assinatura harmonizada límpida e legível em SVG.
 * Regras cabalísticas da assinatura:
 * - Legível (escrita limpa, sem rabiscos ou traços cortantes negativos).
 * - Traçado suavemente ascendente (-2 graus) para emanar expansão e prosperidade.
 * - Mantém o acento de harmonização exato (Mariã Silva / João Silva).
 */
export function CleanSignatureSvg({
  name = 'Ana Paula Férreira',
  className = 'w-full h-12 sm:h-14',
}: {
  name?: string;
  className?: string;
}) {
  const reactId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `goldGrad-${reactId}`;
  const glowId = `sigGlow-${reactId}`;

  return (
    <svg
      viewBox="0 0 320 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Assinatura harmonizada limpa e legível de ${name}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2ca50" />
          <stop offset="45%" stopColor="#ffe57f" />
          <stop offset="85%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#f2ca50" />
        </linearGradient>
        <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#f2ca50" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Rotação ascendente suave de 2 graus (regra: traço ascendente sem cruzar letras) */}
      <g transform="rotate(-2.5 160 32)">
        {/* Texto manuscrito/caligráfico límpido e 100% legível */}
        <text
          x="160"
          y="38"
          textAnchor="middle"
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          style={{
            fontFamily: "'Segoe Script', 'Caveat', 'Dancing Script', 'Alex Brush', 'Playfair Display', cursive, sans-serif",
            fontSize: '34px',
            fontWeight: 600,
            letterSpacing: '1.5px',
          }}
        >
          {name}
        </text>

        {/* Linha guia suave de sustentação ascendente na base */}
        <line
          x1="36"
          y1="48"
          x2="284"
          y2="42"
          stroke={`url(#${gradId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="4 3"
          opacity="0.75"
        />
      </g>
    </svg>
  );
}

/**
 * Dimensão de referência compartilhada entre os 4 mockups da Seção 4:
 * Escala reduzida proporcionalmente (~340px–365px de largura e ~215px–235px de altura)
 * para alinhar a altura visual de todos os mockups com a altura do bloco de texto lateral.
 */
const MOCKUP_FRAME_BASE = 'w-full max-w-[330px] sm:max-w-[360px] mx-auto';

/**
 * MOCKUP 1: Documento Oficial (CIN - Carteira de Identidade Nacional / CNH)
 * Proporção real de cartão ISO/IEC 7810 ID-1: 85.6mm × 53.98mm (~1.586 : 1) em escala reduzida.
 * Serve como referência de tamanho para os demais mockups da seção.
 */
export function DocumentCinMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_FRAME_BASE} aspect-[85.6/54] ${landingMockupFloatClass} relative overflow-hidden flex flex-col justify-between p-3 sm:p-3.5 select-none ${className}`}
    >
      {/* Padrão geométrico de fundo estilo cédula de segurança */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #f2ca50 1px, transparent 1px)`,
          backgroundSize: '14px 14px',
        }}
      />

      {/* Aura dourada superior */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 bg-[#f2ca50]/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Cabeçalho Oficial do Documento */}
      <div className="relative z-10 flex items-center justify-between pb-1.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Brasão estilizado em vetor dourado */}
          <div className="w-6 h-6 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#f2ca50]" fill="none" stroke="currentColor">
              <path
                d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7l1.5 3.5L17 11l-2.5 2.5.5 3.5-3-1.8-3 1.8.5-3.5L7 11l3.5-.5L12 7z"
                fill="#f2ca50"
                fillOpacity="0.4"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div>
            <p className="font-cinzel text-[8px] font-bold tracking-[0.12em] text-[#f2ca50] uppercase leading-tight">
              República Federativa do Brasil
            </p>
            <p className="text-[7px] text-gray-400 tracking-wider uppercase font-medium">
              Carteira de Identidade Nacional (CIN)
            </p>
          </div>
        </div>
        <span className="font-mono text-[7px] text-[#f2ca50]/80 border border-[#f2ca50]/20 px-1.5 py-0.5 rounded-full bg-[#f2ca50]/5 whitespace-nowrap">
          DOCUMENTO OFICIAL
        </span>
      </div>

      {/* Corpo do Documento: Foto biométrica abstrata + Metadados */}
      <div className="relative z-10 grid grid-cols-12 gap-2.5 my-auto items-center py-1">
        {/* Foto biométrica / Silhueta estilizada com auréola */}
        <div className="col-span-3 flex flex-col items-center">
          <div className="w-12 h-15 sm:w-14 sm:h-17 rounded-md bg-gradient-to-b from-white/10 to-white/5 border border-[#f2ca50]/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner py-1.5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#f2ca50] to-transparent animate-pulse" />
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400/80" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <div className="mt-0.5 flex items-center gap-0.5 text-[6px] font-mono text-[#f2ca50]/80">
              <span>●</span> BIO
            </div>
          </div>
        </div>

        {/* Campos Oficiais com Nome de Certidão de Nascimento */}
        <div className="col-span-9 space-y-1">
          <div>
            <p className="text-[6.5px] uppercase tracking-wider text-gray-400">
              Nome Civil (Certidão de Nascimento)
            </p>
            <p className="font-cinzel text-[10px] sm:text-[11px] font-bold text-[#e5e2e1] tracking-wide leading-tight">
              ANA PAULA FERREIRA LIMA
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[7.5px]">
            <div>
              <p className="text-[6px] uppercase tracking-wider text-gray-500">CPF</p>
              <p className="font-mono text-gray-300">***.842.109-**</p>
            </div>
            <div>
              <p className="text-[6px] uppercase tracking-wider text-gray-500">Nascimento</p>
              <p className="font-mono text-gray-300">15/03/1985</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[7.5px]">
            <div>
              <p className="text-[6px] uppercase tracking-wider text-gray-500">Nacionalidade</p>
              <p className="text-gray-300">Brasileira</p>
            </div>
            <div>
              <p className="text-[6px] uppercase tracking-wider text-gray-500">Órgão</p>
              <p className="text-gray-300">SSP / Registro Civil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campo da Assinatura: onde vai o NOME HARMONIZADO LIMPO */}
      <div className="relative z-10 pt-1.5 border-t border-dashed border-[#f2ca50]/30 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[7px] uppercase tracking-[0.14em] font-medium text-[#f2ca50] flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#f2ca50] animate-ping" />
            Assinatura do Titular
          </p>
        </div>

        {/* Quadro com a assinatura límpida e legível Ana Paula Férreira */}
        <div className="relative rounded-md bg-black/40 border border-[#f2ca50]/40 px-2 py-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f2ca50]/5 to-transparent pointer-events-none" />
          <CleanSignatureSvg name="Ana Paula Férreira" className="w-full h-6 sm:h-7" />
        </div>
      </div>
    </div>
  );
}

/**
 * MOCKUP 2: Perfil de Rede Social / Presença Digital
 * Recorte superior da tela de smartphone mantendo a proporção real dos elementos
 * de interface mobile (notch, @handle, avatar, métricas, bio e ações) na mesma
 * escala de altura do Mockup 1 (~225px).
 */
export function SocialProfileMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_FRAME_BASE} ${landingMockupFloatClass} rounded-t-[1.75rem] rounded-b-2xl border-t-2 border-x-2 border-b border-white/15 relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 select-none ${className}`}
    >
      {/* Brilho de fundo místico roxo e dourado */}
      <div
        className="absolute -top-10 -left-10 w-36 h-36 bg-[#d7c6ff]/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#f2ca50]/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Barra superior de smartphone com Notch */}
      <div className="relative z-10 flex flex-col items-center pb-1.5 border-b border-white/10 shrink-0">
        <div className="w-14 h-2.5 bg-black/60 rounded-full mb-1 border border-white/5" />
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] font-semibold text-[#e5e2e1] tracking-wide">
              @anapaulaferreira
            </span>
            <span className="w-3 h-3 rounded-full bg-[#f2ca50] text-[#131313] flex items-center justify-center text-[8px] font-bold">
              ✓
            </span>
          </div>
          <span className="text-gray-400 text-[9px]">•••</span>
        </div>
      </div>

      {/* Header do Perfil: Avatar com anel dourado + Métricas */}
      <div className="relative z-10 flex items-center gap-3 my-2 shrink-0">
        <div className="relative shrink-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f2ca50] via-[#d7c6ff] to-[#f2ca50]">
            <div className="w-full h-full rounded-full bg-[#161616] flex items-center justify-center overflow-hidden border border-black">
              <span className="font-cinzel text-xs sm:text-sm font-bold text-[#f2ca50]">
                AP
              </span>
            </div>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f2ca50] text-[#131313] border border-[#131313] flex items-center justify-center text-[7px] font-bold">
            ✦
          </span>
        </div>

        <div className="flex-1 grid grid-cols-3 text-center gap-1">
          <div>
            <p className="font-mono text-[11px] sm:text-xs font-bold text-[#e5e2e1]">142</p>
            <p className="text-[8px] text-gray-400">posts</p>
          </div>
          <div>
            <p className="font-mono text-[11px] sm:text-xs font-bold text-[#f2ca50]">48.6K</p>
            <p className="text-[8px] text-gray-400">seguidores</p>
          </div>
          <div>
            <p className="font-mono text-[11px] sm:text-xs font-bold text-[#e5e2e1]">1.2K</p>
            <p className="text-[8px] text-gray-400">conexões</p>
          </div>
        </div>
      </div>

      {/* Nome e Biografia Profissional */}
      <div className="relative z-10 space-y-0.5 shrink-0">
        <h4 className="font-cinzel text-xs sm:text-sm font-bold text-[#e5e2e1] leading-tight">
          Ana Paula Férreira
        </h4>
        <p className="text-[10px] text-[#d7c6ff]/90 font-medium leading-tight">
          Diretora Criativa & Consultora Estratégica
        </p>
        <p className="text-[9px] text-gray-400 leading-tight">
          Projetos autorais, comunicação e posicionamento de marca.
        </p>
        <p className="text-[9px] font-mono text-[#f2ca50]/90 flex items-center gap-1 pt-0.5">
          <span>🔗</span> anapaulaferreira.com.br
        </p>
      </div>

      {/* Botões de Ação no rodapé do recorte */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/5 shrink-0">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-full bg-[#f2ca50] text-[#131313] py-1 text-[10px] font-bold tracking-wide flex items-center justify-center gap-1"
        >
          <span>Seguir</span>
          <span className="text-[8px]">✦</span>
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-full bg-white/5 border border-white/10 text-[#e5e2e1] py-1 text-[10px] font-medium flex items-center justify-center"
        >
          Mensagem
        </button>
      </div>
    </div>
  );
}

/**
 * MOCKUP 3: Contratos & Negócios (Recorte da Parte de Assinatura da Folha)
 * Simula apenas a seção final de fechamento e assinatura da folha de contrato,
 * mantendo a mesma escala compacta (~225px de altura) do Mockup 1.
 */
export function ContractMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_FRAME_BASE} ${landingMockupFloatClass} rounded-2xl relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 select-none ${className}`}
    >
      {/* Sombra de recorte superior sugerindo continuação da folha acima */}
      <div
        className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-20"
        aria-hidden="true"
      />

      {/* Brilho dourado central sutil */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#f2ca50]/5 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Trecho final da folha recortada + Selo Digital */}
      <div className="relative z-10 flex items-start justify-between gap-2.5 pb-2 border-b border-white/10 shrink-0">
        <div className="flex-1 min-w-0">
          {/* Linhas de parágrafo anteriores cortadas no topo da página */}
          <div className="space-y-1 mb-2 opacity-45">
            <div className="h-1 bg-white/15 rounded-full w-11/12" />
            <div className="h-1 bg-white/15 rounded-full w-3/4" />
          </div>

          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#f2ca50] bg-[#f2ca50]/10 border border-[#f2ca50]/20 px-1.5 py-0.5 rounded-full">
              PÁG. 3/3 · FECHAMENTO
            </span>
            <span className="text-[8px] font-mono text-gray-500">#DOC-2026-NM-88</span>
          </div>
          <p className="text-[9px] text-gray-300 leading-snug">
            As partes firmam o presente instrumento digital sob padrão único de assinatura.
          </p>
        </div>

        {/* Selo / Carimbo de Identificação Dourado */}
        <div className="w-8 h-8 rounded-full border border-dashed border-[#f2ca50]/70 p-0.5 flex flex-col items-center justify-center text-center bg-[#f2ca50]/10 shrink-0 mt-1">
          <span className="text-[#f2ca50] text-[6px] font-bold uppercase tracking-tighter leading-none">
            DOC
          </span>
          <span className="text-[#f2ca50] text-[8px] leading-none">✦</span>
          <span className="text-[#f2ca50] text-[5.5px] font-bold uppercase tracking-tighter leading-none">
            PDF
          </span>
        </div>
      </div>

      {/* Fechamento do contrato e assinatura límpida ANA PAULA FÉRREIRA */}
      <div className="relative z-10 pt-2 shrink-0">
        <div className="flex items-center justify-between text-[7.5px] text-gray-400 mb-1">
          <span>São Paulo, SP · Conforme acordo firmado</span>
          <span className="font-mono text-[#f2ca50]/80">Plataforma Digital ✓</span>
        </div>

        {/* Bloco de assinatura da parte */}
        <div className="rounded-lg bg-black/40 border border-[#f2ca50]/40 px-2.5 py-1.5 relative overflow-hidden">
          <CleanSignatureSvg name="Ana Paula Férreira" className="w-full h-7 sm:h-8" />
          <div className="mt-1 pt-1 border-t border-[#f2ca50]/20 flex items-center justify-between text-[7.5px] sm:text-[8px]">
            <div>
              <p className="font-cinzel font-bold text-[#e5e2e1] leading-none">ANA PAULA FERREIRA LIMA</p>
              <p className="text-gray-400 text-[6.5px] uppercase tracking-widest leading-none mt-0.5">
                Contratante / Titular
              </p>
            </div>
            <span className="text-[6.5px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
              Assinado Digitalmente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MOCKUP 4: Marca Pessoal & Cartão de Visita / Autoria
 * Proporção real de Cartão de Visita: 90mm × 50mm (~1.75 : 1) na mesma escala de referência.
 */
export function BrandingCardMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_FRAME_BASE} aspect-[1.7/1] ${landingMockupFloatClass} rounded-xl relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 select-none ${className}`}
    >
      {/* Topo do cartão: Monograma 'AP' + Identidade */}
      <div className="flex items-center justify-between shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f2ca50]/20 to-[#d4af37]/5 border border-[#f2ca50]/40 flex items-center justify-center shadow-inner">
          <span className="font-cinzel text-xs font-bold text-[#f2ca50] tracking-wider">
            AP
          </span>
        </div>
        <div className="text-right">
          <p className="font-cinzel text-[8px] tracking-[0.18em] text-[#f2ca50] uppercase font-bold">
            Studio AP
          </p>
          <p className="text-[7px] text-gray-400 uppercase tracking-widest font-mono">
            Consultoria & Autoria
          </p>
        </div>
      </div>

      {/* Nome do Profissional / Autor */}
      <div className="my-auto py-0.5">
        <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] tracking-wide leading-tight">
          Ana Paula Férreira
        </h4>
        <p className="text-[9.5px] text-[#d7c6ff] font-medium tracking-wide">
          Estrategista Criativa & Consultora de Marca
        </p>
      </div>

      {/* Assinatura limpa e legível sem rabiscos */}
      <div className="py-0.5 border-y border-white/5 my-0.5 bg-black/20 rounded-md px-2 shrink-0">
        <CleanSignatureSvg name="Ana Paula Férreira" className="w-full h-6 sm:h-7" />
      </div>

      {/* Informações de contato e autoridade */}
      <div className="grid grid-cols-2 gap-2 text-[8px] text-gray-400 pt-0.5 shrink-0">
        <div className="truncate">
          <p className="text-[6px] uppercase tracking-wider text-gray-500">E-mail Profissional</p>
          <p className="text-[#e5e2e1] font-mono truncate">contato@anapaulaferreira.com</p>
        </div>
        <div className="text-right">
          <p className="text-[6px] uppercase tracking-wider text-gray-500">Presença & Mídia</p>
          <p className="text-[#f2ca50] font-mono">@anapaulaferreira</p>
        </div>
      </div>
    </div>
  );
}
